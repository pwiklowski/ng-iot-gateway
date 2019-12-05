import * as WebSocket from 'ws';
import { MessageType, Request, Response, DeviceConfig } from '@wiklosoft/ng-iot';
import DeviceConnection from './DeviceConnection';
import ControllerList from './ControllerList';

export default class DeviceList extends Array<DeviceConnection> {
  controllerList: ControllerList;
  constructor(controllerList: ControllerList) {
    super();
    this.controllerList = controllerList;
    Object.setPrototypeOf(this, Object.create(DeviceList.prototype));
  }

  public add(item: DeviceConnection) {
    item.onDeviceConnected((config: DeviceConfig) => {
      this.controllerList.deviceAdded(config);
      this.push(item);
    });

    item.onDeviceDisconnected(() => {
      console.log('device disconnected', item.getConfig().deviceUuid, item.getConfig().name);
      this.controllerList.deviceRemoved(item.getConfig().deviceUuid);
      const index = this.indexOf(item, 0);
      if (index > -1) {
        this.splice(index, 1);
      }
    });

    item.onValueUpdated((variableUuid: string, value: object) => {
      this.controllerList.valueUpdated(item.getConfig().deviceUuid, variableUuid, value);
    });
  }

  public getDevices() {
    return this.map((connection) => {
      const { name, deviceUuid } = connection.getConfig();
      return { name, deviceUuid };
    });
  }

  public getDeviceVariable(id: String, variable: string) {
    const config = this.getDevice(id);

    if (config && config.vars.hasOwnProperty(variable)) {
      return config.vars[variable];
    } else {
      return null;
    }
  }

  public getDeviceVariableValue(id: String, variable: string) {
    const config = this.getDevice(id);

    if (config && config.vars.hasOwnProperty(variable)) {
      return config.vars[variable].value;
    } else {
      return null;
    }
  }

  public setDeviceVariableValue(deviceUuid: String, variableUuid: string, value: object) {
    const config = this.getDevice(deviceUuid);

    if (config && config.vars.hasOwnProperty(variableUuid)) {
      config.vars[variableUuid].value = value;

      const deviceConnection = this.find((connection) => {
        return connection.getConfig().deviceUuid === deviceUuid;
      });

      if (deviceConnection) {
        deviceConnection.sendRequest({
          type: MessageType.SetValue,
          args: { deviceUuid, variableUuid, value }
        });
      }

      return config.vars[variableUuid].value;
    } else {
      return null;
    }
  }

  public notifyChange(id: String, variable: string, value: object) {
    this.controllerList.notifyChange(id, variable, value);
  }

  public getDevice(deviceUuid: String) {
    const device = this.find((connection) => {
      return connection.getConfig().deviceUuid === deviceUuid;
    });

    if (device) {
      return device.getConfig();
    } else {
      return null;
    }
  }
}
