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
    /**
     * Test of D0
     */
    d0?: string;
  },
  {
    /**
     * Token of A
     */
    token?: string;
    /**
     * Key of A
     */
    key?: string;
    name?: string;
    levelId?: number;
    level?: string;
    d1?: string;
  },
  {
    token: string;
    key?: string;
    /**
     * Name of A
     */
    name?: string;
    levelId?: number;
    level?: string;
    d2?: string;
  }
> {
  /**
   * Create A
   * @param input - Input for creating A
   * @param input.name - Name of A
   */
  async create(
    input: IInputCreate<
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        c0?: string;
      },
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        c1?: string;
      }
    >
  ): Promise<
    IOutput<
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        c2?: string;
      },
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        c3?: string;
      },
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        c4?: string;
      }
    >
  > {
    return {};
  }

  async update(
    input: IInputUpdate<
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        u0?: string;
      },
      {
        token?: string;
        key?: string;
        name?: string;
        levelId?: number;
        level?: string;
        u1?: string;
      }
    >
  ) {
    return {};
  }
}
