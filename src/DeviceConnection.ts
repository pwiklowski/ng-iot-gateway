import * as WebSocket from 'ws';
import { MessageType, Request, Response, DeviceConfig } from '../../common/interfaces';

export default class DeviceConnection {
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
  }

  getConfig(): DeviceConfig {
    return this.config;
  }

  handleRequest(msg: Request) {
    console.log('handle reqquest', msg);

    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args[0];
        break;
    }
  }

  handleResponse(msg: Response) {
    const callback = this.callbacks.get(msg.resId);
    if (callback) {
      callback(msg);
      this.callbacks.delete(msg.resId);
    }
  }

  sendRequest(req: Request, callback: Function) {
    if (callback !== undefined) {
      this.callbacks.set(req.reqId, callback);
    }
    this.socket.send(JSON.stringify(req));
  }
}
