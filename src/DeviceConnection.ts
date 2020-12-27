import { MessageType, Request, DeviceConfig } from '@wiklosoft/ng-iot';
import WebsocketConnection from './WebsocketConnection';

interface EventCallbacks {
  [variable: string]: Array<Function>;
}

export default class DeviceConnection extends WebsocketConnection {
  eventCallbacks: EventCallbacks = {
    deviceConnected: new Array(),
    deviceDiconnected: new Array(),
    valueUpdated: new Array(),
  };


  handleRequest(msg: Request) {
    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args.config;
        this.eventCallbacks.deviceConnected.map((callback) => callback(this.config));
        break;
      case MessageType.ValueUpdated:
        this.eventCallbacks.valueUpdated.map((callback) => callback(msg.args.variableUuid, msg.args.value));
        break;
    }
  }

  onDisconnect() {
    if (this.config) {
      this.eventCallbacks.deviceDiconnected.map((callback) => callback(this.config.deviceUuid));
    }
  }

  onDeviceDisconnected(callback: Function) {
    this.eventCallbacks.deviceDiconnected.push(callback);
  }

  onDeviceConnected(callback: Function) {
    this.eventCallbacks.deviceConnected.push(callback);
  }

  onValueUpdated(callback: Function) {
    this.eventCallbacks.valueUpdated.push(callback);
  }
}
