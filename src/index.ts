import * as http from 'http';
import * as WebSocket from 'ws';

import DeviceConnection from './DeviceConnection';
import DeviceList from './DevicesList';
import ControllerList from './ControllerList';

import ControllerConnection from './ControllerConnection';
import { username, password } from 'auth.json';
import * as Url from 'url';

import axios, { AxiosBasicCredentials } from 'axios';
import WebServer from './WebServer';

const URL_CTRL = '/controller';
const URL_DEV = '/device';

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

const authorize = async (token) => {
  const auth: AxiosBasicCredentials = { username, password };

  try {
    const response = await axios.post('https://auth.wiklosoft.com/v1/oauth/introspect', new URLSearchParams({ token }), { auth });
    return response.data.active;
  } catch (error) {
    return false;
  }
};

(async () => {
  console.log('start server');
  const app = WebServer(deviceList);

  app.listen(8080);
  websocketServer.listen(8000);
})();
