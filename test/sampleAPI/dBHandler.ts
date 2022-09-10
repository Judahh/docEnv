/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import AService from './services/aService';
import { ADAO } from './dAOs/aDAO';
import BDAO from './dAOs/bDAO';

const journaly = {};
const readDatabase = {};
const eventDatabase = {};

const MSSQL = class {
  constructor(..._b: unknown[]) {}
};

const DAOPersistence = class {
  constructor(..._b: unknown[]) {}
};

const ServiceHandler = class {
  constructor(..._b: unknown[]) {}
};

const MongoPersistence = class {
  constructor(..._b: unknown[]) {}
};

const Handler = class {
  constructor(..._b: unknown[]) {}
};

const DatabaseHandler = class {
  constructor(..._b: unknown[]) {}
  public static async getInstance(..._b: unknown[]) {}
};

const mssql = new MSSQL(readDatabase);

const database = new DAOPersistence(mssql, {
  a: new ADAO(),
  b: new BDAO(),
});

const read = new ServiceHandler(
  readDatabase,
  {
    a: new AService(),
  },
  database
);

const write =
  eventDatabase === undefined ? undefined : new MongoPersistence(eventDatabase);

const handler = new Handler(write, read);

export default DatabaseHandler.getInstance({
  handler: handler,
  journaly: journaly,
});
