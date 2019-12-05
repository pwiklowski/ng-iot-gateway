import { MessageType, Request } from '@wiklosoft/ng-iot';
import WebsocketConnection from './WebsocketConnection';
import * as WebSocket from 'ws';
import ControllerList from './ControllerList';
import DeviceList from './DevicesList';
import { Validator } from 'jsonschema';
export default class ControllerConnection extends WebsocketConnection {
  deviceList: DeviceList;
  controllerList: ControllerList;
  validator: Validator;

  constructor(socket: WebSocket, controllerList: ControllerList, deviceList: DeviceList) {
    super(socket);
    this.deviceList = deviceList;
    this.controllerList = controllerList;
    this.validator = new Validator();
  }

  onDisconnect(): void {
    const index = this.controllerList.indexOf(this, 0);
    if (index > -1) {
      this.controllerList.splice(index, 1);
    }
  }

  handleRequest(msg: Request) {
    switch (msg.type) {
      case MessageType.Hello:
        this.config = msg.args[0];
        break;
      case MessageType.GetDevices:
        this.sendResponse(msg, {
          res: { devices: this.deviceList.map((device) => device.getConfig()) }
        });
        break;
      case MessageType.SetValue:
        const deviceUuid = msg.args.deviceUuid;
        const variableUuid = msg.args.variableUuid;
        const value = msg.args.value;

        const variable = this.deviceList.getDeviceVariable(deviceUuid, variableUuid);

        if (!variable) {
          console.error('unable to find variable with specified id');
          return this.sendResponse(msg, { res: null });
        }

        if (!variable.access.includes('w')) {
          console.error('variable is not writable');
          return this.sendResponse(msg, { res: null });
        }

        const validationResponse = this.validator.validate(value, variable.schema);
        if (validationResponse.valid) {
          const updatedValue = this.deviceList.setDeviceVariableValue(deviceUuid, variableUuid, value);

          this.sendResponse(msg, {
            res: { value: updatedValue }
          });
        } else {
          console.error('unable to validate new value', value);
          return this.sendResponse(msg, { res: null });
        }
    }
  }
}
