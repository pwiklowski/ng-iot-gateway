import express = require('express');
import { Validator } from 'jsonschema';
import { version } from '../package.json';
import DeviceList from 'DevicesList.js';
import { authorizeHttp } from './auth';

const WebServer = (deviceList: DeviceList) => {
  const app: express.Express = express();

  const validator = new Validator();

  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
      limit: '100mb',
      parameterLimit: 1000000,
    })
  );

  app.use(function (req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(version);
  });

  app.get('/devices', authorizeHttp, (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDevices());
  });

  app.get('/device/:deviceId', authorizeHttp, (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDevice(req.params.deviceId));
  });

  app.get('/device/:deviceId/:variable', authorizeHttp, (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDeviceVariable(req.params.deviceId, req.params.variable));
  });

  app.get('/device/:deviceId/:variable/value', authorizeHttp, (req: express.Request, res: express.Response) => {
    res.json(deviceList.getDeviceVariableValue(req.params.deviceId, req.params.variable));
  });

  app.post('/device/:deviceUuid/:variableUuid/value', authorizeHttp, (req: express.Request, res: express.Response) => {
    const value = req.body;
    const variable = deviceList.getDeviceVariable(req.params.deviceUuid, req.params.variableUuid);

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
      return res.json(deviceList.setDeviceVariableValue(req.params.deviceUuid, req.params.variableUuid, value));
    } else {
      res.statusCode = 400;
      return res.json({ error: validationResponse.errors.map((error) => error.message) });
    }
  });
  return app;
};

export default WebServer;
