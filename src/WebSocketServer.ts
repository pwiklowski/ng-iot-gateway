import ControllerConnection from './ControllerConnection';
import * as Url from 'url';
import * as http from 'http';
import * as WebSocket from 'ws';

import DeviceConnection from './DeviceConnection';
import ControllerList from 'ControllerList';
import DeviceList from 'DevicesList';
import { AuthorizedWebSocket } from 'WebsocketConnection';
import { authorizeWebSocket } from './auth';

export const URL_CTRL = '/controller';
export const URL_DEV = '/device';

const WebSocketServer = (ctrlList: ControllerList, deviceList: DeviceList) => {
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
    if (!url.query.token) {
      socket.destroy();
    } else {
      const { authorized, username } = await authorizeWebSocket(url.query.token, url.pathname);

      wss.handleUpgrade(request, socket, head, (ws) => {
        if (authorized) {
          (ws as AuthorizedWebSocket).username = username!;
          wss.emit('connection', ws, request);
        } else {
          console.log('close unauthorized ');
          setTimeout(() => {
            ws.close(4403);
          }, 100);
        }
      });
    }
  });

  wss.on('connection', (ws: AuthorizedWebSocket, req: any) => {
    const url = Url.parse(req.url);
    console.log('new client', url.pathname, ws.username);
    if (url.pathname === URL_CTRL) {
      ctrlList.push(new ControllerConnection(ws, ctrlList, deviceList));
    } else if (url.pathname === URL_DEV) {
      deviceList.add(new DeviceConnection(ws));
    } else {
      ws.close(4403);
    }
  });

  setInterval(() => {
    for (let ws of wss.clients) {
      if ((ws as any).isAlive === false) {
        ws.terminate();
      } else {
        (ws as any).isAlive = false;
        ws.ping(() => {});
      }
    }
  }, 5000);

  return websocketServer;
};

export default WebSocketServer;
