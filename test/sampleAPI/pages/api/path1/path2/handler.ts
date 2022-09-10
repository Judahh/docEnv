/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const request = (_a: unknown[], _b: unknown, _c: unknown, _d: string) => {};
import dbHandler from '../../../../dBHandler';
const Index = {};
export default async (...args: unknown[]) => {
  return await request(args, Index as unknown, dbHandler, 'path2Name');
};
