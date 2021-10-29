import ControllerList from './ControllerList';
import DeviceList from './DevicesList';
import { RulesRunner } from './RulesRunner';
import WebServer from './WebServer';
import WebSocketServer from './WebSocketServer';
import * as mongo from 'mongodb';
import { MONGO_URL } from './environment';

export default class Gateway {
  ctrlList: ControllerList;
  deviceList: DeviceList | null = null;
  rulesRunner: RulesRunner;

  constructor() {
    this.rulesRunner = new RulesRunner(this);
    this.ctrlList = new ControllerList(this);
  }

  getDeviceList() {
    return this.deviceList;
  }

  getControllerList() {
    return this.ctrlList;
  }

  async start() {
    const client: mongo.MongoClient = await mongo.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db('ng-iot');
    const devices = db.collection('devices');

    this.deviceList = new DeviceList(this, devices);

    await this.deviceList.loadDevicesFromDb();

    this.rulesRunner.start();

    const app = await WebServer(this.deviceList);
    const websocketServer = WebSocketServer(this.ctrlList, this.deviceList);

    app.listen(8080);
    websocketServer.listen(8000);
  }
}
