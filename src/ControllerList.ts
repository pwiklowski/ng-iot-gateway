import { MessageType, Request, DeviceConfig } from '@wiklosoft/ng-iot';
import ControllerConnection from './ControllerConnection';
import { Gateway } from './index';

export default class ControllerList extends Array<ControllerConnection> {
  gateway: Gateway;

  constructor(gateway: Gateway) {
    super();
    Object.setPrototypeOf(this, Object.create(ControllerList.prototype));
    this.gateway = gateway;
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

  deviceListChanged() {
    this.map((connection) => {
      const devices = this.gateway.getDeviceList().getDevices(connection.getUsername());

      const notification: Request = {
        type: MessageType.DeviceListChanged,
        args: { devices },
      };

      connection.sendRequest(notification);
    });
  }
}
