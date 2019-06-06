import { MessageType, Request, DeviceConfig } from '../../common/interfaces';
import WebsocketConnection from './WebsocketConnection';

interface EventCallbacks {
  [variable: string]: Array<Function>;
}

export default class DeviceConnection extends WebsocketConnection {
  eventCallbacks: EventCallbacks = {
    deviceConnected: new Array(),
    deviceDiconnected: new Array()
  };

  getConfig(): DeviceConfig {
    return this.config;
  }

  handleRequest(msg: Request) {
    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args.config;
        this.eventCallbacks.deviceConnected.map((callback) => callback(this.config));
        break;
    }
  }

  onDisconnect() {
    this.eventCallbacks.deviceDiconnected.map((callback) => callback(this.config.id));
  }

  onDeviceDisconnected(callback: Function) {
    this.eventCallbacks.deviceDiconnected.push(callback);
  }

  onDeviceConnected(callback: Function) {
    this.eventCallbacks.deviceConnected.push(callback);
  }
}
