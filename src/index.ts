import DeviceList from './DevicesList';
import ControllerList from './ControllerList';

import WebServer from './WebServer';
import WebSocketServer from './WebSocketServer';

let ctrlList = new ControllerList();
let deviceList = new DeviceList(ctrlList);

(async () => {
  console.log('start server');
  const app = WebServer(deviceList);
  const websocketServer = WebSocketServer(ctrlList, deviceList);

  app.listen(8080);
  websocketServer.listen(8000);
})();
