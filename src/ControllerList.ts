import * as WebSocket from 'ws';
import { MessageType, Request, Response } from '../../common/interfaces';
import ControllerConnection from './ControllerConnection';

export default class ControllerList extends Array<ControllerConnection> {
  constructor() {
    super();
    Object.setPrototypeOf(this, Object.create(ControllerList.prototype));
  }
}
