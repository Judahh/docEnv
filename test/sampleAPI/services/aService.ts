/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
const BaseService = class<A, B> {};
interface IInputCreate<A> {}
interface IInputUpdate<A> {}
interface IOutput<A, B> {}
export default class AService extends BaseService<
  {
    token?: string;
    key?: string;
    name?: string;
    levelId?: number;
    level?: string;
  },
  {
    token?: string;
    key?: string;
    name?: string;
    levelId?: number;
    level?: string;
  }
> {
  async create(
    input: IInputCreate<{
      token?: string;
      key?: string;
      name?: string;
      levelId?: number;
      level?: string;
    }>
  ): Promise<
    IOutput<
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
      },
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
      }
    >
  > {
    return {};
  }

  async update(
    input: IInputUpdate<{
      token?: string;
      key?: string;
      name?: string;
      levelId?: number;
      level?: string;
    }>
  ): Promise<
    IOutput<
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
      },
      {
        token?: string;
      }
    >
  > {
    return {};
  }
}
