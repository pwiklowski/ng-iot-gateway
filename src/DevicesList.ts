import { MessageType, DeviceConfig } from '@wiklosoft/ng-iot';
import Gateway from './Gateway';
import DeviceConnection from './DeviceConnection';
import * as mongo from 'mongodb';

export interface Device {
  connection: DeviceConnection | null;
  username: string;
  config: DeviceConfig;
}

export default class DeviceList extends Array<Device> {
  gateway: Gateway;
  devicesCollection: mongo.Collection;

  constructor(gateway: Gateway, devices: mongo.Collection) {
    super();
    this.devicesCollection = devices;
    this.gateway = gateway;
    Object.setPrototypeOf(this, Object.create(DeviceList.prototype));
  }

  async loadDevicesFromDb() {
    let devices = await this.devicesCollection.find({}).toArray();
    devices = devices.map((device) => JSON.parse(JSON.stringify(device).replace('__DOLAR__', '$')));
    this.push(...devices);
  }

  async insertDeviceToDb(device: Device) {
    device = JSON.parse(JSON.stringify(device).replace('$', '__DOLAR__'));
    device.config.isConnected = false;
    await this.devicesCollection.insertOne(device);
  }

  async add(connection: DeviceConnection) {
    connection.deviceConnected.subscribe(async (config: DeviceConfig) => {
      let device = this.find((device: Device) => device.config.deviceUuid === config.deviceUuid);
      if (device !== undefined) {
        device.connection = connection;
        device.config.isConnected = true;
      } else {
        const device = { config, username: connection.getUsername(), connection };
        device.config.isConnected = true;
        this.push(device);
        await this.insertDeviceToDb({ config, username: connection.getUsername(), connection: null });
      }

      console.log('device connected', config.deviceUuid, config.name);
      this.gateway.getControllerList().deviceAdded(config);
    });

    connection.deviceDiconnected.subscribe(() => {
      let device = this.find((device: Device) => device.connection === connection);

      if (device) {
        console.log('device disconnected', device.config.deviceUuid, device.config.name);
        this.gateway.getControllerList().deviceRemoved(device.config.deviceUuid);
        device.config.isConnected = false;
        device.connection = null;
      }
    });

    connection.valueUpdated.subscribe(({ variableUuid, value }) => {
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

  public getDevice(username: string, deviceUuid: String) {
    const device = this.find((device: Device) => {
      return device.username === username && device.config.deviceUuid === deviceUuid;
    });

    return device ? device.config : null;
  }
}
