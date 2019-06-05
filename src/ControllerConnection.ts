import { MessageType, Request } from '../../common/interfaces';
import WebsocketConnection from './WebsocketConnection';

export default class ControllerConnection extends WebsocketConnection {
  handleRequest(msg: Request) {
    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args[0];
        break;
    }
  }
}
