import * as WebSocket from 'ws';
import { Request, Response, DeviceConfig } from '@wiklosoft/ng-iot';

export interface AuthorizedWebSocket extends WebSocket {
  username: string;
}

export default abstract class DeviceConnection {
  socket: AuthorizedWebSocket;
  callbacks: Map<number, Function>;
  config!: DeviceConfig;

  constructor(socket: AuthorizedWebSocket) {
    this.callbacks = new Map();
    this.socket = socket;
    this.socket.on('message', (message: string) => {
      try {
        const msg = JSON.parse(message);
        if (msg.resId !== undefined) {
          this.handleResponse(msg);
        } else {
          this.handleRequest(msg);
        }
      } catch (e) {
        console.error(e);
      }
    });

    this.socket.on('close', this.onDisconnect.bind(this));
  }

  abstract onDisconnect(): void;

  abstract handleRequest(msg: Request): void;

  handleResponse(msg: Response) {
    if (msg.resId) {
      const callback = this.callbacks.get(msg.resId);
      if (callback) {
        callback(msg);
        this.callbacks.delete(msg.resId);
      }
    }
  }

  sendRequest(req: Request, callback?: Function) {
    if (callback !== undefined && req.reqId) {
      this.callbacks.set(req.reqId, callback);
    }
    this.socket.send(JSON.stringify(req));
  }

  sendResponse(req: Request, res: Response) {
    res.resId = req.reqId;
    this.socket.send(JSON.stringify(res));
  }

  getUsername() {
    return this.socket.username;
  }
}
