import ControllerList from './ControllerList';
import DeviceList from './DevicesList';
import { RulesRunner } from './RulesRunner';
import WebServer from './WebServer';
import WebSocketServer from './WebSocketServer';

export default class Gateway {
  ctrlList: ControllerList;
  deviceList: DeviceList;
  rulesRunner: RulesRunner;

  constructor() {
    this.rulesRunner = new RulesRunner(this);
    this.ctrlList = new ControllerList(this);
    this.deviceList = new DeviceList(this);
  }

  getDeviceList() {
    return this.deviceList;
  }

  getControllerList() {
    return this.ctrlList;
  }

  async start() {
    this.rulesRunner.start();
    const app = await WebServer(this.deviceList);
    const websocketServer = WebSocketServer(this.ctrlList, this.deviceList);

    app.listen(8080);
    websocketServer.listen(8000);
  }
}
