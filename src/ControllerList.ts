import * as WebSocket from 'ws';
import { MessageType, Request, Response } from '@wiklosoft/ng-iot';
import ControllerConnection from './ControllerConnection';

export default class ControllerList extends Array<ControllerConnection> {
  constructor() {
    super();
    Object.setPrototypeOf(this, Object.create(ControllerList.prototype));
  }

  notifyChange(id: String, variable: string, value: object) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.Notification,
        args: { id, variable, value }
      };

      connection.sendRequest(notification);
    });
  }

  deviceAdded(id: String) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.DeviceConnected,
        args: { id }
      };
      connection.sendRequest(notification);
    });
  }

  deviceRemoved(id: String) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.DeviceDisconnected,
        args: { id }
      };
      connection.sendRequest(notification);
    });
  }
}
