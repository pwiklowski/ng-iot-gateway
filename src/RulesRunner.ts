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
    const rules: Array<Rule> = await this.rules.find({ deviceUuid, variableUuid, username }).toArray();

    this.vm.setGlobal('value', value);
    this.vm.setGlobal('setValue', (deviceUuid, variableUuid, newValue) => {
      deviceList.setDeviceVariableValue(username, deviceUuid, variableUuid, newValue);
    });
    this.vm.setGlobal('getValue', (deviceUuid, variableUuid) => {
      return deviceList.getDeviceVariableValue(username, deviceUuid, variableUuid);
    });

    rules.forEach((rule: Rule) => {
      const thiz = this;
      this.vm.setGlobal('log', function () {
        console.log(rule._id, '>', ...arguments);

        const args: IArguments = arguments;
        let line = new Date().toJSON();
        for (let i = 0; i < args.length; i++) {
          line += ' ' + JSON.stringify(args[i]);
        }
        thiz.gateway.ctrlList.ruleLog(username, rule._id, line);
      });
      this.vm.run(rule.script);
    });
  }
}
