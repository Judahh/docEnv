/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
const BaseService = class<filter, input, output> {};
interface IInputCreate<filter, input> {}
interface IInputUpdate<filter, input = any> {}
interface IOutput<filter, input, output> {}
export { BaseService, IInputCreate, IInputUpdate, IOutput };
