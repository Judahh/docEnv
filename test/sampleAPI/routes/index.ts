/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { RouterSingleton, IRouter, Mauth } from '../../mock/route';
import AController from '../controllers/aController';
import BController from '../controllers/bController';
import CController from '../controllers/cController';

export default class Index extends RouterSingleton {
  createRoutes(initDefault?: IRouter) {
    if (!initDefault) throw new Error('Must init Init Default');

    const mauth = new Mauth();

    if (!initDefault.middlewares || initDefault.middlewares.length > 0)
      initDefault.middlewares = [];
    const authentication = mauth?.authentication.bind(mauth);
    const permission = mauth?.permission.bind(mauth);

    if (!this.controller) this.controller = {};

    if (!this.controller.path1Name)
      this.controller.path1Name = new AController(initDefault);

    if (!this.controller.path2Name)
      this.controller.path2Name = new BController(initDefault);

    initDefault.middlewares.push(authentication, permission);

    if (!this.controller.path3Name)
      this.controller.path3Name = new CController(initDefault);
  }
}
