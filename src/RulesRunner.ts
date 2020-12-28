import DeviceList from 'DevicesList';
import { NodeVM, VM } from 'vm2';
import * as mongo from 'mongodb';
import { Rule } from '@wiklosoft/ng-iot';
import Gateway from 'Gateway';

export class RulesRunner {
  vm: VM;
  rules;
  gateway: Gateway;

  constructor(gateway: Gateway) {
    this.vm = new NodeVM({
      console: 'off',
      timeout: 100,
    });
    this.gateway = gateway;
  }

  async start() {
    const client: mongo.MongoClient = await mongo.connect('mongodb://mongo:27017', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db('ng-iot');
    this.rules = db.collection('rules');
  }

  async valueUpdated(deviceList: DeviceList, username: string, deviceUuid: string, variableUuid: string, value: any) {
    const rules: Array<Rule> = await this.rules
      .aggregate([
        {
          $match: { deviceUuid, variableUuid, username },
        },
        {
          $project: { _id: 0, id: '$_id', script: 1 },
        },
      ])
      .toArray();

    rules.forEach((rule: Rule) => {
      const thiz = this;

      this.logRule(username, rule.id, [`Triggered by value ${JSON.stringify(value)}`]);

      this.vm.setGlobal('value', value);
      this.vm.setGlobal('setValue', (deviceUuid, variableUuid, newValue) => {
        this.logRule(username, rule.id, [`Set value ${deviceUuid} ${variableUuid} ${JSON.stringify(newValue)}`]);
        const res = deviceList.setDeviceVariableValue(username, deviceUuid, variableUuid, newValue);
        if (res.error !== undefined) {
          this.logRule(username, rule.id, [res.error]);
        }
      });
      this.vm.setGlobal('getValue', (deviceUuid, variableUuid) => {
        return deviceList.getDeviceVariableValue(username, deviceUuid, variableUuid);
      });
      this.vm.setGlobal('log', function () {
        thiz.logRule(username, rule.id, arguments);
      });
      try {
        this.vm.run(rule.script);
      } catch (e) {
        this.logRule(username, rule.id, [e.name, e.message]);
      }
    });
  }

  logRule(username, ruleId, args) {
    console.log(ruleId, '>', ...args);
    let line = new Date().toJSON();
    for (let i = 0; i < args.length; i++) {
      line += ' ' + JSON.stringify(args[i]);
    }
    this.gateway.ctrlList.ruleLog(username, ruleId, line);
  }
}
