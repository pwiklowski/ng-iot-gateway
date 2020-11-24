import * as WebSocket from 'ws';
import { MessageType, Request, Response, DeviceConfig } from '@wiklosoft/ng-iot';
import ControllerConnection from './ControllerConnection';

export default class ControllerList extends Array<ControllerConnection> {
  constructor() {
    super();
    Object.setPrototypeOf(this, Object.create(ControllerList.prototype));
  }

  notifyChange(id: String, variableUuid: string, value: object) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.Notification,
        args: { id, variableUuid, value },
      };

      connection.sendRequest(notification);
    });
  }

  valueUpdated(deviceUuid: string, variableUuid: string, value: any) {
    //TODO make sure that controller wants that update
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.ValueUpdated,
        args: { deviceUuid, variableUuid, value },
      };
      connection.sendRequest(notification);
    });
  }

  deviceAdded(device: DeviceConfig) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.DeviceConnected,
        args: { device },
      };
      connection.sendRequest(notification);
    });
  }

  deviceRemoved(id: String) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.DeviceDisconnected,
        args: { id },
      };
      connection.sendRequest(notification);
    });
  }

  deviceListChanged(devices) {
    this.map((connection) => {
      const notification: Request = {
        type: MessageType.DeviceListChanged,
        args: { devices },
      };

      connection.sendRequest(notification);
    });
  }
}
