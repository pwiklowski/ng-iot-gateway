import * as WebSocket from 'ws';
import { MessageType, Request, Response } from '../../common/interfaces';
import DeviceConnection from './DeviceConnection';

export default class DeviceList extends Array<DeviceConnection> {
  constructor() {
    super();
    Object.setPrototypeOf(this, Object.create(DeviceList.prototype));
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

      return config.vars[variable].value;
    } else {
      return null;
    }
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
