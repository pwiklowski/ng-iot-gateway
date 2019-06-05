import { MessageType, Request, DeviceConfig } from '../../common/interfaces';
import WebsocketConnection from './WebsocketConnection';

export default class DeviceConnection extends WebsocketConnection {
  getConfig(): DeviceConfig {
    return this.config;
  }

  handleRequest(msg: Request) {
    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args.config;
        break;
    }
  }
}
