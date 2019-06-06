import * as WebSocket from 'ws';
import { Request, Response } from '../../common/interfaces';

export default abstract class DeviceConnection {
  socket: WebSocket;
  callbacks: Map<number, Function>;
  config: any;

  constructor(socket: WebSocket) {
    this.callbacks = new Map();
    this.socket = socket;
    this.socket.on('message', (message: string) => {
      const msg = JSON.parse(message);
      if (msg.resId !== undefined) {
        this.handleResponse(msg);
      } else {
        this.handleRequest(msg);
      }
    });

    this.socket.on('close', this.onDisconnect.bind(this));
  }

  abstract onDisconnect(): void;

  abstract handleRequest(msg: Request): void;

  handleResponse(msg: Response) {
    const callback = this.callbacks.get(msg.resId);
    if (callback) {
      callback(msg);
      this.callbacks.delete(msg.resId);
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
}
