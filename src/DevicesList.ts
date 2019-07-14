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
      this.controllerList.deviceRemoved(item.getConfig().id);
      const index = this.indexOf(item, 0);
      if (index > -1) {
        this.splice(index, 1);
      }
    });
  }

  public getDevices() {
    return this.map((connection) => {
      const { name, id } = connection.getConfig();
      return { name, id };
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

  public setDeviceVariableValue(id: String, variable: string, value: object) {
    const config = this.getDevice(id);

    if (config && config.vars.hasOwnProperty(variable)) {
      config.vars[variable].value = value;
      this.notifyChange(id, variable, value);
      return config.vars[variable].value;
    } else {
      return null;
    }
  }

  public notifyChange(id: String, variable: string, value: object) {
    this.controllerList.notifyChange(id, variable, value);
  }

  public getDevice(id: String) {
    const device = this.find((connection) => {
      return connection.getConfig().id === id;
    });

    if (device) {
      return device.getConfig();
    } else {
      return null;
    }
  }
}
