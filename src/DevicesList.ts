import { MessageType, DeviceConfig } from '@wiklosoft/ng-iot';
import Gateway from './Gateway';
import DeviceConnection from './DeviceConnection';

export default class DeviceList extends Array<DeviceConnection> {
  gateway: Gateway;
  constructor(gateway: Gateway) {
    super();
    this.gateway = gateway;
    Object.setPrototypeOf(this, Object.create(DeviceList.prototype));
  }

  public add(item: DeviceConnection) {
    item.onDeviceConnected((config: DeviceConfig) => {
      this.push(item);
      console.log('device connected', config.deviceUuid, config.name);
      this.gateway.getControllerList().deviceAdded(config);
    });

    item.onDeviceDisconnected(() => {
      console.log('device disconnected', item.getConfig().deviceUuid, item.getConfig().name);

      const index = this.indexOf(item, 0);
      if (index > -1) {
        this.splice(index, 1);
      }

      this.gateway.getControllerList().deviceRemoved(item.getConfig().deviceUuid);
    });

    item.onValueUpdated((variableUuid: string, value: object) => {
      this.gateway.getControllerList().valueUpdated(item.getConfig().deviceUuid, variableUuid, value);

      this.gateway.rulesRunner.valueUpdated(this, item.getUsername(), item.getConfig().deviceUuid, variableUuid, value);
    });
  }

  public getDevices(username: string) {
    return this.filter((connection) => connection.getUsername() === username).map((connection) => {
      return connection.getConfig();
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

      const deviceConnection = this.find((connection) => {
        return connection.getConfig().deviceUuid === deviceUuid;
      });

      if (deviceConnection) {
        deviceConnection.sendRequest({
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
    const device = this.find((connection) => {
      if (connection.getUsername() !== username) {
        return false;
      }
      return connection.getConfig().deviceUuid === deviceUuid;
    });

    if (device) {
      return device.getConfig();
    } else {
      return null;
    }
  }
}
