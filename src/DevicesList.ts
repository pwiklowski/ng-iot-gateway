import { MessageType, DeviceConfig } from '@wiklosoft/ng-iot';
import Gateway from './Gateway';
import DeviceConnection from './DeviceConnection';
import * as mongo from 'mongodb';
import { Validator } from 'jsonschema';

export interface Device {
  connection: DeviceConnection | null;
  username: string;
  config: DeviceConfig;
}

export default class DeviceList extends Array<Device> {
  gateway: Gateway;
  devicesCollection: mongo.Collection;
  validator: Validator;

  constructor(gateway: Gateway, devices: mongo.Collection) {
    super();
    this.devicesCollection = devices;
    this.gateway = gateway;
    Object.setPrototypeOf(this, Object.create(DeviceList.prototype));
    this.validator = new Validator();
  }

  async loadDevicesFromDb() {
    let devices = await this.devicesCollection.find({}).toArray();
    devices = devices.map((device) => JSON.parse(JSON.stringify(device).replace(/__DOLAR__/g, '$')));
    this.push(...devices);
  }

  async insertDeviceToDb(device: Device) {
    device = JSON.parse(JSON.stringify(device).replace(/\$/g, '__DOLAR__'));
    device.config.isConnected = false;
    await this.devicesCollection.insertOne(device);
  }

  async updateDeviceToDb(device: Device) {
    device = JSON.parse(JSON.stringify(device).replace(/\$/g, '__DOLAR__'));
    device.config.isConnected = false;
    await this.devicesCollection.replaceOne({ 'config.deviceUuid': device.config.deviceUuid }, device);
  }

  async add(connection: DeviceConnection) {
    connection.deviceConnected.subscribe(async (config: DeviceConfig) => {
      let device = this.find((device: Device) => device.config.deviceUuid === config.deviceUuid);
      if (device !== undefined) {
        const index = this.indexOf(device);
        this[index] = device;
        device.connection = connection;
        device.config.isConnected = true;
        device.config.name = config.name;

        for (const [uuid, variable] of Object.entries(device.config.vars)) {
          this.setDeviceVariableValue(connection.getUsername(), device.config.deviceUuid, uuid, variable.value);
        }

        await this.updateDeviceToDb({ config, username: connection.getUsername(), connection: null });
      } else {
        const device = { config, username: connection.getUsername(), connection };
        device.config.isConnected = true;
        this.push(device);
        await this.insertDeviceToDb({ config, username: connection.getUsername(), connection: null });
      }

      console.log('device connected', config.deviceUuid, JSON.stringify(config, null, 2));
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

    connection.valueUpdated.subscribe(async ({ variableUuid, value }) => {
      let device = this.find((device: Device) => device.connection === connection);

      if (device) {
        await this.updateDeviceToDb({ config: device.config, username: connection.getUsername(), connection: null });
        this.gateway.getControllerList().valueUpdated(device.config.deviceUuid, variableUuid, value);
        this.gateway.rulesRunner.valueUpdated(this, connection.getUsername(), device.config.deviceUuid, variableUuid, value);
      }
    });

    setTimeout(() => {
      connection.getDeviceConfig();
    }, 500);
  }

  removeDevice(deviceUuid) {
    const index = this.findIndex((device) => device.config.deviceUuid === deviceUuid);

    console.log('remove devce', deviceUuid, index);
    if (index > -1) {
      this.splice(index, 1);
    }

    this.gateway.getControllerList().deviceListChanged();
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

  setDeviceVariableValue(username: string, deviceUuid: String, variableUuid: string, value: object) {
    const device = this.find((device: Device) => {
      return device.username === username && device.config.deviceUuid === deviceUuid;
    });

    if (device === undefined) {
      return { error: "Device doesn't exist" };
    }

    if (!device.config.vars.hasOwnProperty(variableUuid)) {
      return { error: "Variable doesn't exist" };
    }

    if (!device.connection) {
      return { error: 'Device is not connected' };
    }
    const variable = device.config.vars[variableUuid];

    if (!variable.access.includes('w')) {
      return { error: 'Variable is not writable' };
    }

    try {
      const validationResponse = this.validator.validate(value, variable.schema);
      if (validationResponse.valid) {
        variable.value = value;
        device.connection.sendRequest({
          type: MessageType.SetValue,
          args: { deviceUuid, variableUuid, value },
        });
        return { value: variable.value };
      } else {
        console.error('Unable to validate new value', value);
        return { error: validationResponse.errors.map((error) => error.message) };
      }
    } catch (e) {
      console.error(e);
      return { error: e.message };
    }
  }

  public getDevice(username: string, deviceUuid: String) {
    const device = this.find((device: Device) => {
      return device.username === username && device.config.deviceUuid === deviceUuid;
    });

    return device ? device.config : null;
  }
}
