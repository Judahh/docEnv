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

export {
  writeDatabaseOptions,
  writeDatabaseSSL,
  writeDatabaseConnectionTimeoutNumber,
  writeDatabaseRequestTimeoutNumber,
  writeDatabaseEncryptionDisabled,
  readDatabaseOptions,
  readDatabaseSSL,
  readDatabaseConnectionTimeoutNumber,
  readDatabaseRequestTimeoutNumber,
  readDatabaseEncryptionDisabledEnv,
};