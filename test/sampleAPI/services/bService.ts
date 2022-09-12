/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  BaseService,
  IInputCreate,
  IInputUpdate,
  IOutput,
} from '../../mock/service';
import { BFilter, BInput, BOutput } from '../models/b';

export default class BService extends BaseService<BFilter, BInput, BOutput> {
  async create(
    input: IInputCreate<BFilter, BInput>
  ): Promise<IOutput<BFilter, BInput, BOutput>> {
    return {};
  }

  async update(
    input: IInputUpdate<BFilter, BInput>
  ): Promise<IOutput<BFilter, BInput, BOutput>> {
    return {};
  }
}
