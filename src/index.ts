import DeviceList from './DevicesList';
import ControllerList from './ControllerList';

import WebServer from './WebServer';
import WebSocketServer from './WebSocketServer';

export class Gateway {
  ctrlList: ControllerList;
  deviceList: DeviceList;
  constructor() {
    this.ctrlList = new ControllerList(this);
    this.deviceList = new DeviceList(this);
  }

  getDeviceList() {
    return this.deviceList;
  }

  getControllerList() {
    return this.ctrlList;
  }

  start() {
    const app = WebServer(this.deviceList);
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
