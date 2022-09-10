/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  BaseService,
  IInputCreate,
  IInputUpdate,
  IOutput,
} from '../../mock/service';

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
