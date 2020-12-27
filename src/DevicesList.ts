import { MessageType, DeviceConfig } from '@wiklosoft/ng-iot';
import Gateway from './Gateway';
import DeviceConnection from './DeviceConnection';

export interface Device {
  connection: DeviceConnection | null;
  username: string;
  config: DeviceConfig;
}

export default class DeviceList extends Array<Device> {
  gateway: Gateway;
  constructor(gateway: Gateway) {
    super();
    this.gateway = gateway;
    Object.setPrototypeOf(this, Object.create(DeviceList.prototype));
  }

  public add(connection: DeviceConnection) {
    connection.onDeviceConnected((config: DeviceConfig) => {
      let device = this.find((device: Device) => device.config.deviceUuid === config.deviceUuid);
      if (device !== undefined) {
        device.connection = connection;
        device.config.isConnected = true;
      } else {
        const device = { config, username: connection.getUsername(), connection };
        device.config.isConnected = true;
        this.push(device);
      }

      console.log('device connected', config.deviceUuid, config.name);
      this.gateway.getControllerList().deviceAdded(config);
    });

    connection.onDeviceDisconnected(() => {
      let device = this.find((device: Device) => device.connection === connection);

      if (device) {
        console.log('device disconnected', device.config.deviceUuid, device.config.name);
        this.gateway.getControllerList().deviceRemoved(device.config.deviceUuid);
        device.config.isConnected = false;
        device.connection = null;
      }
    });

    connection.onValueUpdated((variableUuid: string, value: object) => {
      let device = this.find((device: Device) => device.connection === connection);

      if (device) {
        this.gateway.getControllerList().valueUpdated(device.config.deviceUuid, variableUuid, value);
        this.gateway.rulesRunner.valueUpdated(this, connection.getUsername(), device.config.deviceUuid, variableUuid, value);
      }
    });
  }

  public getDevices(username: string) {
    return this.filter((device: Device) => device.username === username).map((device) => {
      return device.config;
    });
  }

  public getDeviceVariable(username: string, id: String, variable: string) {
    const config = this.getDevice(username, id);

    if (config && config.vars.hasOwnProperty(variable)) {
      return config.vars[variable];
    } else {
      return null;
    }
  }

  public getDeviceVariableValue(username: string, id: String, variable: string) {
    const config = this.getDevice(username, id);

    if (config && config.vars.hasOwnProperty(variable)) {
      return config.vars[variable].value;
    } else {
      return null;
    }
  }

  public setDeviceVariableValue(username: string, deviceUuid: String, variableUuid: string, value: object) {
    const config = this.getDevice(username, deviceUuid);

    if (config && config.vars.hasOwnProperty(variableUuid)) {
      config.vars[variableUuid].value = value;

      const device = this.find((device: Device) => {
        return device.config.deviceUuid === deviceUuid;
      });

      if (device && device.connection) {
        device.connection.sendRequest({
          type: MessageType.SetValue,
          args: { deviceUuid, variableUuid, value },
        });
        return config.vars[variableUuid].value;
      }
    }
    return null;
  }

  public notifyChange(id: String, variable: string, value: object) {
    this.gateway.getControllerList().notifyChange(id, variable, value);
  }

  public getDevice(username: string, deviceUuid: String) {
    const device = this.find((device: Device) => {
      if (device && device.username !== username) {
        return false;
      }
      return device.config.deviceUuid === deviceUuid;
    });

    if (device) {
      return device.config;
    } else {
      return null;
    }
  }
}
