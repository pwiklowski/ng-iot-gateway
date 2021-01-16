import * as WebSocket from 'ws';
import { Request, Response, DeviceConfig } from '@wiklosoft/ng-iot';

export interface AuthorizedWebSocket extends WebSocket {
  username: string;
}

export default abstract class DeviceConnection {
  socket: AuthorizedWebSocket;
  callbacks: Map<number, Function>;
  timeout: Map<number, Function> = new Map();
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
    if (msg.resId !== undefined) {
      const callback = this.callbacks.get(msg.resId);
      if (callback) {
        callback(msg);
        this.callbacks.delete(msg.resId);
      }

      const timeout = this.timeout.get(msg.resId);
      if (timeout) {
        this.timeout.delete(msg.resId);
      }
    }
  }

  sendRequest(req: Request, callback?: Function, timeout?: Function) {
    if (callback !== undefined && req.reqId !== undefined) {
      this.callbacks.set(req.reqId, callback);
    }
    if (timeout !== undefined && req.reqId !== undefined) {
      const reqId = req.reqId;
      this.timeout.set(reqId, timeout);

      setTimeout(() => {
        const timeout = this.timeout.get(reqId);
        if (timeout) {
          console.warn('timout occured for ', reqId);
          timeout();
          this.callbacks.delete(reqId);
          this.timeout.delete(reqId);
        }
      }, 5000);
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

  close() {
    this.socket.close();
  }
}
