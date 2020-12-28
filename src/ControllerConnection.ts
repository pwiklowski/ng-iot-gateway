import { MessageType, Request, DeviceConfig } from '@wiklosoft/ng-iot';
import WebsocketConnection, { AuthorizedWebSocket } from './WebsocketConnection';
import ControllerList from './ControllerList';
import DeviceList from './DevicesList';

export default class ControllerConnection extends WebsocketConnection {
  deviceList: DeviceList;
  controllerList: ControllerList;

  constructor(socket: AuthorizedWebSocket, controllerList: ControllerList, deviceList: DeviceList) {
    super(socket);
    this.deviceList = deviceList;
    this.controllerList = controllerList;
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
      case MessageType.Ping:
        this.sendResponse(msg, {
          res: {},
        });
        break;
      case MessageType.GetDevices:
        this.sendResponse(msg, {
          res: [...this.deviceList.getDevices(this.getUsername())],
        });
        break;
      case MessageType.GetDevice: {
        const deviceUuid = msg.args.deviceUuid;
        const deviceConfig: DeviceConfig | null = this.deviceList.getDevice(this.getUsername(), deviceUuid);

        this.sendResponse(msg, { res: { ...deviceConfig } });
        break;
      }
      case MessageType.SetValue:
        const deviceUuid = msg.args.deviceUuid;
        const variableUuid = msg.args.variableUuid;

        //TODO make sure that value is always sent as object

        const value = JSON.parse(msg.args.value);
        const res = this.deviceList.setDeviceVariableValue(this.getUsername(), deviceUuid, variableUuid, value);
        this.sendResponse(msg, { res });
    }
  }
}
