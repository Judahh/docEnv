// import { Extractor } from '../../source/extractor';

const file = `
import { PersistenceInfo } from 'flexiblepersistence';
import { ConnectionOptions } from 'tls';
const writeDatabaseOptions =
  process.env.DATABASE_OPTIONS || process.env.DATABASE_WRITE_OPTIONS;
const writeDatabaseSSLEnv =
  process.env.DATABASE_SSL || process.env.DATABASE_WRITE_SSL || 'false';
const writeDatabaseSSL:
  | boolean
  | ConnectionOptions
  | ConnectionOptions
  | undefined = writeDatabaseSSLEnv
  ? JSON.parse(writeDatabaseSSLEnv)
  : undefined;
const writeDatabaseConnectionTimeout =
  process.env.DATABASE_CONNECTION_TIMEOUT ||
  process.env.DATABASE_WRITE_CONNECTION_TIMEOUT;
const writeDatabaseConnectionTimeoutNumber = writeDatabaseConnectionTimeout
  ? +writeDatabaseConnectionTimeout
  : 60000;
const writeDatabaseRequestTimeout =
  process.env.DATABASE_REQUEST_TIMEOUT ||
  process.env.DATABASE_WRITE_REQUEST_TIMEOUT;
const writeDatabaseRequestTimeoutNumber = writeDatabaseRequestTimeout
  ? +writeDatabaseRequestTimeout
  : 60000;

const writeDatabaseEncryptionDisabledEnv =
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === '1';

const writeDatabaseEncryptionDisabled = writeDatabaseEncryptionDisabledEnv
  ? {
      encrypt: false,
      trustServerCertificate: false,
    }
  : undefined;

const eventInfo =
  process.env.DATABASE_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_WRITE_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_WRITE_DISABLED?.toLowerCase() === '1'
    ? undefined
    : {
        uri: process.env.DATABASE_URI || process.env.DATABASE_WRITE_URI,
        connectionType:
          process.env.DATABASE_CONNECTION_TYPE ||
          process.env.DATABASE_WRITE_CONNECTION_TYPE,
        options: writeDatabaseOptions
          ? JSON.parse(writeDatabaseOptions)
          : writeDatabaseEncryptionDisabled,
        database:
          process.env.DATABASE_NAME ||
          process.env.DATABASE_WRITE_NAME ||
          'write',
        host: process.env.DATABASE_HOST || process.env.DATABASE_WRITE_HOST,
        port: process.env.DATABASE_PORT || process.env.DATABASE_WRITE_PORT,
        username: process.env.DATABASE_USER || process.env.DATABASE_WRITE_USER,
        password:
          process.env.DATABASE_PASSWORD || process.env.DATABASE_WRITE_PASSWORD,
        ssl: writeDatabaseSSL,
        connectionTimeout: writeDatabaseConnectionTimeoutNumber,
        requestTimeout: writeDatabaseRequestTimeoutNumber,
      };

const readDatabaseOptions =
  process.env.DATABASE_OPTIONS || process.env.DATABASE_READ_OPTIONS;
const readDatabaseSSLEnv =
  process.env.DATABASE_SSL || process.env.DATABASE_READ_SSL || 'false';
const readDatabaseSSL:
  | boolean
  | ConnectionOptions
  | ConnectionOptions
  | undefined = readDatabaseSSLEnv ? JSON.parse(readDatabaseSSLEnv) : undefined;
const readDatabaseConnectionTimeout =
  process.env.DATABASE_CONNECTION_TIMEOUT ||
  process.env.DATABASE_READ_CONNECTION_TIMEOUT;
const readDatabaseConnectionTimeoutNumber = readDatabaseConnectionTimeout
  ? +readDatabaseConnectionTimeout
  : 60000;
const readDatabaseRequestTimeout =
  process.env.DATABASE_REQUEST_TIMEOUT ||
  process.env.DATABASE_READ_REQUEST_TIMEOUT;
const readDatabaseRequestTimeoutNumber = readDatabaseRequestTimeout
  ? +readDatabaseRequestTimeout
  : 60000;

const readDatabaseEncryptionDisabledEnv =
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_READ_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_READ_ENCRYPTION_DISABLED?.toLowerCase() === '1';

const readDatabaseEncryptionDisabled = readDatabaseEncryptionDisabledEnv
  ? {
      encrypt: false,
      trustServerCertificate: false,
    }
  : undefined;

const readInfo =
  process.env.DATABASE_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_READ_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_READ_DISABLED?.toLowerCase() === '1'
    ? undefined
    : {
        uri: process.env.DATABASE_URI || process.env.DATABASE_READ_URI,
        connectionType:
          process.env.DATABASE_CONNECTION_TYPE ||
          process.env.DATABASE_READ_CONNECTION_TYPE,
        options: readDatabaseOptions
          ? JSON.parse(readDatabaseOptions)
          : readDatabaseEncryptionDisabled,
        database:
          process.env.DATABASE_NAME || process.env.DATABASE_READ_NAME || 'read',
        host: process.env.DATABASE_HOST || process.env.DATABASE_READ_HOST,
        port: process.env.DATABASE_PORT || process.env.DATABASE_READ_PORT,
        username: process.env.DATABASE_USER || process.env.DATABASE_READ_USER,
        password:
          process.env.DATABASE_PASSWORD || process.env.DATABASE_READ_PASSWORD,
        ssl: readDatabaseSSL,
        connectionTimeout: readDatabaseConnectionTimeoutNumber,
        requestTimeout: readDatabaseRequestTimeoutNumber,
      };

let readDatabase;
let eventDatabase;

const setEventDatabase = (journaly) => {
  if (eventInfo === undefined) return undefined;
  else eventDatabase = new PersistenceInfo(eventInfo, journaly);
  if (
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === 'true' ||
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === '1' ||
    eventDatabase !== undefined
  ) {
    console.log(
      'eventInfo:',
      eventDatabase?.host,
      eventDatabase?.port,
      eventDatabase?.database
    );
  }
};

const setReadDatabase = (journaly) => {
  if (readInfo === undefined) return undefined;
  else readDatabase = new PersistenceInfo(readInfo, journaly);
  if (
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === 'true' ||
    process.env.SHOW_DATABASE_INFO?.toLowerCase() === '1' ||
    readDatabase !== undefined
  ) {
    console.log(
      'readInfo:',
      readDatabase?.host,
      readDatabase?.port,
      readDatabase?.database
    );
  }
};

const getEventDatabase = (journaly?) => {
  if (eventInfo === undefined) return undefined;
  if (eventDatabase !== undefined) {
    return eventDatabase;
  } else if (journaly) {
    setEventDatabase(journaly);
    return eventDatabase;
  }
  return undefined;
};

const getReadDatabase = (journaly?) => {
  if (readInfo === undefined) return undefined;
  if (readDatabase !== undefined) {
    return readDatabase;
  } else if (journaly) {
    setReadDatabase(journaly);
    return readDatabase;
  }
  return undefined;
};

export {
  eventInfo,
  readInfo,
  setEventDatabase,
  setReadDatabase,
  getEventDatabase,
  getReadDatabase,
};
`;

test('Test Ternary Large Without Groups', async () => {
  expect(file.length).toBe(6812);
});
