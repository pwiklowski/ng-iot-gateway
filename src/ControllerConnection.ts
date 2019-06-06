import { MessageType, Request } from '../../common/interfaces';
import WebsocketConnection from './WebsocketConnection';
import * as WebSocket from 'ws';
import ControllerList from './ControllerList';
import DeviceList from './DevicesList';
export default class ControllerConnection extends WebsocketConnection {
  deviceList: DeviceList;
  controllerList: ControllerList;

  constructor(socket: WebSocket, controllerList: ControllerList, deviceList: DeviceList) {
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
      case MessageType.GetDevices:
        this.sendResponse(msg, {
          res: { devices: this.deviceList.map((device) => device.getConfig().id) }
        });

        break;
    }
  }
}
