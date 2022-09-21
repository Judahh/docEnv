/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import {
  BaseService,
  IInputCreate,
  IInputUpdate,
  IOutput,
} from '../../mock/service';
import CFilter from '../models/cFilter';
import CInput from '../models/cInput';
import COutput from '../models/cOutput';

export default class CService extends BaseService<CFilter, CInput, COutput> {
  async create(
    input: IInputCreate<CFilter, CInput>
  ): Promise<IOutput<CFilter, CInput, COutput>> {
    return {};
  }

  async update(
    input: IInputUpdate<CFilter, CInput>
  ): Promise<IOutput<CFilter, CInput, COutput>> {
    return {};
  }

  /**
   * @of - delete
   * Delete C
   */
}
