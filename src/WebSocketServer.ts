import ControllerConnection from './ControllerConnection';
import { username, password } from './auth.json';
import * as Url from 'url';
import * as http from 'http';
import * as WebSocket from 'ws';

import DeviceConnection from './DeviceConnection';
import axios, { AxiosBasicCredentials } from 'axios';
import ControllerList from 'ControllerList';
import DeviceList from 'DevicesList';

const WebSocketServer = (ctrlList: ControllerList, deviceList: DeviceList) => {
  const URL_CTRL = '/controller';
  const URL_DEV = '/device';

  const websocketServer = http.createServer();
  const wss = new WebSocket.Server({ noServer: true });

  const authorize = async (token) => {
    const auth: AxiosBasicCredentials = { username, password };

    try {
      const response = await axios.post('https://auth.wiklosoft.com/v1/oauth/introspect', new URLSearchParams({ token }), { auth });
      return response.data.active;
    } catch (error) {
      return false;
    }
  };

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
    });
  }, 10000);

  return websocketServer;
};

export default WebSocketServer;
