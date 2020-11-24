import ControllerConnection from './ControllerConnection';
import { username, password } from './auth.json';
import * as Url from 'url';
import * as http from 'http';
import * as WebSocket from 'ws';

import DeviceConnection from './DeviceConnection';
import axios, { AxiosBasicCredentials } from 'axios';
import ControllerList from 'ControllerList';
import DeviceList from 'DevicesList';
import { AuthorizedWebSocket } from 'WebsocketConnection';

const WebSocketServer = (ctrlList: ControllerList, deviceList: DeviceList) => {
  const URL_CTRL = '/controller';
  const URL_DEV = '/device';

  const websocketServer = http.createServer();
  const wss = new WebSocket.Server({ noServer: true });

  const authorize = async (token) => {
    const auth: AxiosBasicCredentials = { username, password };

    try {
      const response = await axios.post('https://auth.wiklosoft.com/v1/oauth/introspect', new URLSearchParams({ token }), { auth });
      console.log(response.data);
      return { authorized: response.data.active, username: response.data.username };
    } catch (error) {
      console.error(error);
      return { authorized: false, username: null };
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
    console.log('upgrade', request.url);
    if (!url.query.token) {
      console.log('destroy');
      socket.destroy();
    } else {
      const { authorized, username } = await authorize(url.query.token);

      wss.handleUpgrade(request, socket, head, (ws) => {
        if (authorized) {
          (ws as AuthorizedWebSocket).username = username;
          wss.emit('connection', ws, request);
        } else {
          ws.close(4403);
        }
      });
    }
  });

  wss.on('connection', (ws: AuthorizedWebSocket, req: any) => {
    const url = Url.parse(req.url);
    if (url.pathname === URL_CTRL) {
      ctrlList.push(new ControllerConnection(ws, ctrlList, deviceList));
    } else if (url.pathname === URL_DEV) {
      deviceList.add(new DeviceConnection(ws));
    } else {
      ws.close(4403);
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
