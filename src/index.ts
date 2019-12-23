import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

import DeviceConnection from './DeviceConnection';
import DeviceList from './DevicesList';
import ControllerList from './ControllerList';

import { Validator } from 'jsonschema';
import ControllerConnection from './ControllerConnection';
import { version } from '../package.json';
import { username, password } from 'auth.json';
import * as Url from 'url';

import axios, { AxiosBasicCredentials } from 'axios';

const URL_CTRL = '/controller';
const URL_DEV = '/device';

const app: any = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
    limit: '100mb',
    parameterLimit: 1000000
  })
);

const websocketServer = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws: any) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

websocketServer.on('upgrade', async (request, socket, head) => {
  const url = Url.parse(request.url, true);

  if (url.query.token && (await authorize(url.query.token))) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocket, req: any) => {
  const url = Url.parse(req.url);
  if (url.pathname === URL_CTRL) {
    ctrlList.push(new ControllerConnection(ws, ctrlList, deviceList));
  } else if (url.pathname === URL_DEV) {
    deviceList.add(new DeviceConnection(ws));
  } else {
    ws.close();
  }
});

setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if ((ws as any).isAlive === false) {
      console.log('remove dead connection');
      return ws.terminate();
    }

    (ws as any).isAlive = false;
    ws.ping(() => {});
    console.log('ping');
  });
}, 10000);

let ctrlList = new ControllerList();
let deviceList = new DeviceList(ctrlList);

const validator = new Validator();

const authorize = async (token) => {
  const auth: AxiosBasicCredentials = { username, password };

  try {
    const response = await axios.post('https://auth.wiklosoft.com/v1/oauth/introspect', new URLSearchParams({ token }), { auth });
    return response.data.active;
  } catch (error) {
    return false;
  }
};

app.use(function(req: any, res: any, next: any) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

(async () => {
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(version);
  });

  app.get('/devices', (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDevices());
  });

  app.get('/device/:deviceId', (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDevice(req.params.deviceId));
  });

  app.get('/device/:deviceId/:variable', (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDeviceVariable(req.params.deviceId, req.params.variable));
  });

  app.get('/device/:deviceId/:variable/value', (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDeviceVariableValue(req.params.deviceId, req.params.variable));
  });

  app.post('/device/:deviceUuid/:variableUuid/value', (req: express.Request, res: express.Response) => {
    const value = req.body;
    const variable = deviceList.getDeviceVariable(req.params.deviceUuid, req.params.variableUuid);

    if (!variable) {
      res.statusCode = 404;
      return res.json({});
    }

    if (!variable.access.includes('w')) {
      res.statusCode = 405;
      return res.json({});
    }

    const validationResponse = validator.validate(value, variable.schema);
    if (validationResponse.valid) {
      return res.json(deviceList.setDeviceVariableValue(req.params.deviceUuid, req.params.variableUuid, value));
    } else {
      res.statusCode = 400;
      return res.json({ error: validationResponse.errors.map((error) => error.message) });
    }
  });

  app.listen(8080);
  websocketServer.listen(8000);
})();
