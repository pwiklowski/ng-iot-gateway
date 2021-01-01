import { PresetSchema, RuleSchema, AliasSchema } from './schemas';
import express = require('express');
import { Validator } from 'jsonschema';
import { version } from '../package.json';
import DeviceList, { Device } from 'DevicesList';
import { authorizeHttp } from './auth';
import * as mongo from 'mongodb';
import { Alias, Preset, Rule } from '@wiklosoft/ng-iot';
import { Validator as ExpressValidator } from 'express-json-validator-middleware';
import cors from 'cors';

const RULE_PROJECTION = { username: 0, _id: 0 };
const PRESET_PROJECTION = { username: 0, _id: 0 };
const ALIAS_PROJECTION = { username: 0, _id: 0 };

interface AuthorizedRequest extends express.Request {
  user?: any;
}

const WebServer = async (deviceList: DeviceList) => {
  const app: express.Express = express();

  const validator = new Validator();
  const expressValidator = new ExpressValidator({ allErrors: true });

  app.use(express.json());
  app.use(
    cors({
      origin: ['http://localhost:4200', 'https://iot-dash.wiklosoft.com'],
      optionsSuccessStatus: 204,
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: '100mb',
      parameterLimit: 1000000,
    })
  );

  const client: mongo.MongoClient = await mongo.connect('mongodb://mongo:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db('ng-iot');
  const rules = db.collection('rules');
  const presets = db.collection('presets');
  const aliases = db.collection('aliases');
  const devices = db.collection('devices');

  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(version);
  });

  app.get('/rules', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const allRules = await rules
      .aggregate([
        {
          $match: { username: req.user.name },
        },
        {
          $project: { _id: 0, id: '$_id', name: 1, deviceUuid: 1 },
        },
      ])
      .toArray();
    return res.json(allRules);
  });

  app.get('/rule/:ruleId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const ruleId = req.params.ruleId;
    const rule = (await rules.findOne({ _id: new mongo.ObjectID(ruleId), username: req.user.name }, { projection: RULE_PROJECTION })) as Rule;
    if (rule) {
      res.json(rule);
    } else {
      res.sendStatus(404);
    }
  });

  app.post('/rules', authorizeHttp, <any>expressValidator.validate({ body: RuleSchema }), async (req: AuthorizedRequest, res: express.Response) => {
    const newRule: Rule = req.body;
    const username = req.user.name;
    const rule: Rule = {
      ...newRule,
      username,
    };

    const response = await rules.insertOne(rule);
    if (response.result.ok === 1) {
      res.json(response.ops[0]);
      return;
    }
    res.statusCode = 500;
    res.json(null);
  });

  app.delete('/rule/:ruleId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const ruleId = req.params.ruleId;
    const rule = (await rules.findOne({ _id: new mongo.ObjectID(ruleId), username: req.user.name })) as Rule;
    if (rule) {
      await rules.deleteOne({ _id: new mongo.ObjectID(ruleId), username: req.user.name });
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  });

  app.patch('/rule/:ruleId', authorizeHttp, <any>expressValidator.validate({ body: RuleSchema }), async (req: AuthorizedRequest, res: express.Response) => {
    const ruleId = req.params.ruleId;
    const username = req.user.name;

    let rule = (await rules.findOne({ _id: new mongo.ObjectID(ruleId), username }, { projection: RULE_PROJECTION })) as Rule;
    if (rule) {
      const ruleUpdate: Rule = req.body;
      rule = { ...rule, ...ruleUpdate, username };
      await rules.replaceOne({ _id: new mongo.ObjectID(ruleId) }, rule);
      return res.json(rule);
    } else {
      return res.sendStatus(404);
    }
  });

  app.get('/presets', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const allPresets = await presets
      .aggregate([
        {
          $match: { username: req.user.name },
        },
        {
          $project: { _id: 0, id: '$_id', name: 1, variables: 1 },
        },
      ])
      .toArray();
    return res.json(allPresets);
  });

  app.get('/preset/:presetId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const presetId = req.params.presetId;
    const preset = (await presets.findOne({ _id: new mongo.ObjectID(presetId), username: req.user.name }, { projection: PRESET_PROJECTION })) as Preset;
    if (preset) {
      res.json(preset);
    } else {
      res.sendStatus(404);
    }
  });

  app.post('/presets', authorizeHttp, <any>expressValidator.validate({ body: PresetSchema }), async (req: AuthorizedRequest, res: express.Response) => {
    const newPreset: Preset = req.body;
    const username = req.user.name;
    const preset: Preset = {
      ...newPreset,
      username,
    };

    const response = await presets.insertOne(preset);
    if (response.result.ok === 1) {
      res.json(response.ops[0]);
      return;
    }
    res.statusCode = 500;
    res.json(null);
  });

  app.delete('/preset/:presetId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const presetId = req.params.presetId;
    const preset = (await presets.findOne({ _id: new mongo.ObjectID(presetId), username: req.user.name })) as Preset;
    if (preset) {
      await presets.deleteOne({ _id: new mongo.ObjectID(presetId), username: req.user.name });
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  });

  app.patch(
    '/preset/:presetId',
    authorizeHttp,
    <any>expressValidator.validate({ body: PresetSchema }),
    async (req: AuthorizedRequest, res: express.Response) => {
      const presetId = req.params.presetId;
      const username = req.user.name;

      let preset = (await presets.findOne({ _id: new mongo.ObjectID(presetId), username }, { projection: PRESET_PROJECTION })) as Preset;
      if (preset) {
        const presetUpdate: Preset = req.body;
        preset = { ...preset, ...presetUpdate, username };
        await presets.replaceOne({ _id: new mongo.ObjectID(presetId), username: req.user.name }, preset);
        return res.json(preset);
      } else {
        return res.sendStatus(404);
      }
    }
  );

  app.get('/aliases', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const allAliases = await aliases
      .aggregate([
        {
          $match: { username: req.user.name },
        },
        {
          $project: { _id: 0, id: '$_id', deviceUuid: 1, name: 1 },
        },
      ])
      .toArray();
    return res.json(allAliases);
  });

  app.get('/aliases/:aliasId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const aliasId = req.params.aliasId;
    const alias = (await aliases.findOne({ _id: new mongo.ObjectID(aliasId), username: req.user.name }, { projection: ALIAS_PROJECTION })) as Alias;
    if (alias) {
      res.json(alias);
    } else {
      res.sendStatus(404);
    }
  });

  app.post('/aliases', authorizeHttp, <any>expressValidator.validate({ body: AliasSchema }), async (req: AuthorizedRequest, res: express.Response) => {
    const newAlias: Alias = req.body;
    const username = req.user.name;
    const alias: Alias = {
      ...newAlias,
      username,
    };

    let found = (await aliases.findOne({ deviceUuid: alias.deviceUuid, username }, { projection: ALIAS_PROJECTION })) as Alias;
    if (found) {
      res.statusCode = 400;
      return res.json(null);
    }

    const response = await aliases.insertOne(alias);
    if (response.result.ok === 1) {
      return res.json(response.ops[0]);
    }
    res.statusCode = 500;
    return res.json(null);
  });

  app.delete('/aliases/:aliasId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const aliasId = req.params.aliasId;
    const alias = (await aliases.findOne({ _id: new mongo.ObjectID(aliasId), username: req.user.name })) as Alias;
    if (alias) {
      await aliases.deleteOne({ _id: new mongo.ObjectID(aliasId), username: req.user.name });
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  });

  app.patch(
    '/aliases/:aliasId',
    authorizeHttp,
    <any>expressValidator.validate({ body: AliasSchema }),
    async (req: AuthorizedRequest, res: express.Response) => {
      const aliasId = req.params.aliasId;
      const username = req.user.name;

      let alias = (await aliases.findOne({ _id: new mongo.ObjectID(aliasId), username }, { projection: ALIAS_PROJECTION })) as Alias;
      if (alias) {
        const aliasUpdate: Alias = req.body;
        alias = { ...alias, ...aliasUpdate, username };
        await aliases.replaceOne({ _id: new mongo.ObjectID(aliasId), username }, alias);
        return res.json(alias);
      } else {
        return res.sendStatus(404);
      }
    }
  );

  app.get('/devices', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDevices(req.user.name));
  });

  app.get('/device/:deviceId', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDevice(req.user.name, req.params.deviceId));
  });

  app.delete('/devices', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const deviceUuid = req.query.deviceUuid;
    const username = req.user.name;

    let device = (await devices.findOne({ 'config.deviceUuid': deviceUuid, username })) as Device;
    if (device) {
      await devices.deleteOne({ 'config.deviceUuid': deviceUuid, username });

      deviceList.removeDevice(deviceUuid);
      return res.sendStatus(204);
    } else {
      return res.sendStatus(404);
    }
  });

  app.get('/device/:deviceId/:variable', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDeviceVariable(req.user.name, req.params.deviceId, req.params.variable));
  });

  app.get('/device/:deviceId/:variable/value', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDeviceVariableValue(req.user.name, req.params.deviceId, req.params.variable));
  });

  app.post('/device/:deviceUuid/:variableUuid/value', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    const value = req.body;

    const result = deviceList.setDeviceVariableValue(req.user.name, req.params.deviceUuid, req.params.variableUuid, value);
    if (result.error !== undefined) {
      res.statusCode = 400;
      return res.json(result);
    } else {
      return res.json(result.value);
    }
  });
  return app;
};

export default WebServer;
