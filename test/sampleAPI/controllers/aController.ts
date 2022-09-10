import {
  Mixin,
  BaseControllerCreate,
  BaseControllerUpdate,
} from '../../mock/controller';

export default class AController extends Mixin(
  BaseControllerCreate,
  BaseControllerUpdate
) {}
