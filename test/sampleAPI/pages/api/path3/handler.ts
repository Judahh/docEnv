import { Index, request } from '../../../../mock/route';
import dbHandler from '../../../dBHandler';

export default async (...args: unknown[]) => {
  return await request(args, Index as unknown, dbHandler, 'path3Name');
};
