import { RulesRunner } from './RulesRunner';
import DeviceList from './DevicesList';
import ControllerList from './ControllerList';

import WebServer from './WebServer';
import WebSocketServer from './WebSocketServer';

const logCopy = console.log.bind(console);

console.log = function () {
  if (arguments.length) {
    var timestamp = new Date().toJSON(); // The easiest way I found to get milliseconds in the timestamp
    var args: any = arguments;
    args[0] = timestamp + ' > ' + arguments[0];
    logCopy.apply(this, args);
  }
};
export class Gateway {
  ctrlList: ControllerList;
  deviceList: DeviceList;
  rulesRunner: RulesRunner;

  constructor() {
    this.rulesRunner = new RulesRunner();
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

(async () => {
  const gateway = new Gateway();
  console.log('start server');
  gateway.start();
})();
