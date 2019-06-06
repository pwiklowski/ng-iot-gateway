import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

import DeviceConnection from './DeviceConnection';
import DeviceList from './DevicesList';
import ControllerList from './ControllerList';

import { Validator } from 'jsonschema';
import ControllerConnection from './ControllerConnection';

const URL_CTRL = '/controller';
const URL_DEV = '/device';

const app: express.Application = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
    limit: '100mb',
    parameterLimit: 1000000
  })
);

const server = http.createServer(app);
const wss = new WebSocket.Server({ port: 8000 });
let client = null;

let ctrlList = new ControllerList();
let deviceList = new DeviceList(ctrlList);

const validator = new Validator();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

(async () => {
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send('hello world2');
  });

  wss.on('connection', (ws: WebSocket, req) => {
    if (req.url === URL_CTRL) {
      ctrlList.push(new ControllerConnection(ws, ctrlList, deviceList));
    } else if (req.url === URL_DEV) {
      deviceList.add(new DeviceConnection(ws));
    } else {
      ws.close();
    }
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

  app.post('/device/:deviceId/:variable/value', (req: express.Request, res: express.Response) => {
    const value = req.body;
    const variable = deviceList.getDeviceVariable(req.params.deviceId, req.params.variable);

    if (!variable) {
      res.statusCode = 404;
      return res.json({});
    }


    const validationResponse = validator.validate(value, variable.schema);
    if (validationResponse.valid) {
      res.json(deviceList.setDeviceVariableValue(req.params.deviceId, req.params.variable, value));
    } else {
      res.statusCode = 400;
      res.json({ error: validationResponse.errors.map((error) => error.message) });
    }
  });

  app.listen(8080);
})();
