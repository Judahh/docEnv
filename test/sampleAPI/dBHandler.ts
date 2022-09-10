import AService from './services/aService';
import { ADAO } from './dAOs/aDAO';
import BDAO from './dAOs/bDAO';

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
