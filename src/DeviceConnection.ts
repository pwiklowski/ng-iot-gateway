import { MessageType, Request, DeviceConfig } from '@wiklosoft/ng-iot';
import { Subject } from 'rxjs';
import WebsocketConnection from './WebsocketConnection';

export default class DeviceConnection extends WebsocketConnection {
  //change to subjcet
  deviceConnected = new Subject<DeviceConfig>();
  deviceDiconnected = new Subject<string>();
  valueUpdated = new Subject<any>();
  reqId = 0;

  getDeviceConfig() {
    const request: Request = {
      reqId: this.reqId++,
      type: MessageType.Hello,
    };
    this.sendRequest(
      request,
      (msg) => {
        this.config = msg.res.config;
        this.deviceConnected.next(this.config);
        console.log('connected', this.config);
      },
      () => {
        console.warn('on timeout');
        this.close();
      }
    );
  }

  handleRequest(msg: Request) {
    switch (msg.type) {
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
