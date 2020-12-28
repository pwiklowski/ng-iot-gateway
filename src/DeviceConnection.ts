import { MessageType, Request, DeviceConfig } from '@wiklosoft/ng-iot';
import { Subject } from 'rxjs';
import WebsocketConnection from './WebsocketConnection';

interface EventCallbacks {
  [variable: string]: Array<Function>;
}

export default class DeviceConnection extends WebsocketConnection {
  //change to subjcet
  deviceConnected = new Subject<DeviceConfig>();
  deviceDiconnected = new Subject<string>();
  valueUpdated = new Subject<any>();

  handleRequest(msg: Request) {
    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args.config;
        this.deviceConnected.next(this.config);
        break;
      case MessageType.ValueUpdated:
        this.valueUpdated.next({ variableUuid: msg.args.variableUuid, value: msg.args.value });
        break;
    }
  }

  onDisconnect() {
    if (this.config) {
      this.deviceDiconnected.next(this.config.deviceUuid);
    }
  }
}
