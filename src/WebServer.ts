import { RuleSchema } from './schemas';
import express = require('express');
import { Validator } from 'jsonschema';
import { version } from '../package.json';
import DeviceList from 'DevicesList';
import { authorizeHttp } from './auth';
import * as mongo from 'mongodb';
import { Rule } from '@wiklosoft/ng-iot';
import { ValidationError, Validator as ExpressValidator } from 'express-json-validator-middleware';
import cors from 'cors';

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
      origin: 'http://localhost:4200',
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

  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(version);
  });

  app.get('/rules', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const allRules = await rules.find({ username: req.user.name }).toArray();
    return res.json(allRules);
  });

  app.get('/rule/:ruleId', authorizeHttp, async (req: AuthorizedRequest, res: express.Response) => {
    const ruleId = req.params.ruleId;
    const rule = (await rules.findOne({ _id: new mongo.ObjectID(ruleId), username: req.user.name })) as Rule;
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
      await rules.deleteOne({ _id: new mongo.ObjectID(ruleId) });
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  });

  app.patch('/rule/:ruleId', authorizeHttp, <any>expressValidator.validate({ body: RuleSchema }), async (req: AuthorizedRequest, res: express.Response) => {
    const ruleId = req.params.ruleId;
    const username = req.user.name;

    let rule = (await rules.findOne({ _id: new mongo.ObjectID(ruleId), username })) as Rule;
    if (rule) {
      const ruleUpdate: Rule = req.body;
      rule = { ...rule, ...ruleUpdate, username };
      await rules.replaceOne({ _id: new mongo.ObjectID(ruleId) }, rule);
      return res.json(rule);
    } else {
      return res.sendStatus(404);
    }
  });

  app.get('/devices', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDevices(req.user.name));
  });

  app.get('/device/:deviceId', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDevice(req.user.name, req.params.deviceId));
  });

  app.get('/device/:deviceId/:variable', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDeviceVariable(req.user.name, req.params.deviceId, req.params.variable));
  });

  app.get('/device/:deviceId/:variable/value', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    res.json(deviceList.getDeviceVariableValue(req.user.name, req.params.deviceId, req.params.variable));
  });

  app.post('/device/:deviceUuid/:variableUuid/value', authorizeHttp, (req: AuthorizedRequest, res: express.Response) => {
    const value = req.body;
    const variable = deviceList.getDeviceVariable(req.user.name, req.params.deviceUuid, req.params.variableUuid);

    if (!variable) {
      res.statusCode = 404;
      return res.json({});
    }

    if (!variable.access.includes('w')) {
      res.statusCode = 405;
      return res.json({});
    }

    const validationResponse = validator.validate(value, variable.schema);
    if (validationResponse.valid) {
      console.log('set ', req.params.deviceUuid, req.params.variableUuid, value);
      return res.json(deviceList.setDeviceVariableValue(req.user.name, req.params.deviceUuid, req.params.variableUuid, value));
    } else {
      res.statusCode = 400;
      return res.json({ error: validationResponse.errors.map((error) => error.message) });
    }
  });
  return app;
};

export default WebServer;
