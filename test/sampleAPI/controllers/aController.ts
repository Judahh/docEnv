/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Mixin = (..._a: unknown[]) =>
  class {
    constructor(..._b: unknown[]) {}
  };
const BaseControllerCreate = {};
const BaseControllerUpdate = {};

export default class AController extends Mixin(
  BaseControllerCreate,
  BaseControllerUpdate
) {}
