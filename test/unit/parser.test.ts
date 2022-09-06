import { readFile } from 'fs/promises';
import { Parser } from '../../source/parser';

const expVars0 = {
  writeDatabaseOptions: {
    name: 'writeDatabaseOptions',
    environmentVariables: ['DATABASE_OPTIONS', 'DATABASE_WRITE_OPTIONS'],
    defaultValues: {
      or: [
        'process.env.DATABASE_OPTIONS',
        'process.env.DATABASE_WRITE_OPTIONS',
      ],
    },
  },
  writeDatabaseSSLEnv: {
    name: 'writeDatabaseSSLEnv',
    environmentVariables: ['DATABASE_SSL', 'DATABASE_WRITE_SSL'],
    defaultValues: {
      or: [
        'process.env.DATABASE_SSL',
        'process.env.DATABASE_WRITE_SSL',
        "'false'",
      ],
    },
  },
  writeDatabaseConnectionTimeout: {
    name: 'writeDatabaseConnectionTimeout',
    environmentVariables: [
      'DATABASE_CONNECTION_TIMEOUT',
      'DATABASE_WRITE_CONNECTION_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_CONNECTION_TIMEOUT',
        'process.env.DATABASE_WRITE_CONNECTION_TIMEOUT',
      ],
    },
  },
  writeDatabaseRequestTimeout: {
    name: 'writeDatabaseRequestTimeout',
    environmentVariables: [
      'DATABASE_REQUEST_TIMEOUT',
      'DATABASE_WRITE_REQUEST_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_REQUEST_TIMEOUT',
        'process.env.DATABASE_WRITE_REQUEST_TIMEOUT',
      ],
    },
  },
  writeDatabaseEncryptionDisabledEnv: {
    name: 'writeDatabaseEncryptionDisabledEnv',
    environmentVariables: [
      'DATABASE_ENCRYPTION_DISABLED',
      'DATABASE_WRITE_ENCRYPTION_DISABLED',
    ],
    defaultValues: {
      or: [
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === '1'",
        "process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === '1'",
      ],
    },
  },
  readDatabaseOptions: {
    name: 'readDatabaseOptions',
    environmentVariables: ['DATABASE_OPTIONS', 'DATABASE_READ_OPTIONS'],
    defaultValues: {
      or: ['process.env.DATABASE_OPTIONS', 'process.env.DATABASE_READ_OPTIONS'],
    },
  },
  readDatabaseSSLEnv: {
    name: 'readDatabaseSSLEnv',
    environmentVariables: ['DATABASE_SSL', 'DATABASE_READ_SSL'],
    defaultValues: {
      or: [
        'process.env.DATABASE_SSL',
        'process.env.DATABASE_READ_SSL',
        "'false'",
      ],
    },
  },
  readDatabaseConnectionTimeout: {
    name: 'readDatabaseConnectionTimeout',
    environmentVariables: [
      'DATABASE_CONNECTION_TIMEOUT',
      'DATABASE_READ_CONNECTION_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_CONNECTION_TIMEOUT',
        'process.env.DATABASE_READ_CONNECTION_TIMEOUT',
      ],
    },
  },
  readDatabaseRequestTimeout: {
    name: 'readDatabaseRequestTimeout',
    environmentVariables: [
      'DATABASE_REQUEST_TIMEOUT',
      'DATABASE_READ_REQUEST_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_REQUEST_TIMEOUT',
        'process.env.DATABASE_READ_REQUEST_TIMEOUT',
      ],
    },
  },
  readDatabaseEncryptionDisabledEnv: {
    name: 'readDatabaseEncryptionDisabledEnv',
    environmentVariables: [
      'DATABASE_ENCRYPTION_DISABLED',
      'DATABASE_READ_ENCRYPTION_DISABLED',
    ],
    defaultValues: {
      or: [
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === '1'",
        "process.env.DATABASE_READ_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_READ_ENCRYPTION_DISABLED.toLowerCase() === '1'",
      ],
    },
  },
};

const expVars1 = {
  writeDatabaseOptions: {
    name: 'writeDatabaseOptions',
    environmentVariables: ['DATABASE_OPTIONS', 'DATABASE_WRITE_OPTIONS'],
    defaultValues: {
      or: [
        'process.env.DATABASE_OPTIONS',
        'process.env.DATABASE_WRITE_OPTIONS',
      ],
    },
  },
  writeDatabaseSSLEnv: {
    name: 'writeDatabaseSSLEnv',
    environmentVariables: ['DATABASE_SSL', 'DATABASE_WRITE_SSL'],
    defaultValues: {
      or: [
        'process.env.DATABASE_SSL',
        'process.env.DATABASE_WRITE_SSL',
        "'false'",
      ],
    },
  },
  writeDatabaseConnectionTimeout: {
    name: 'writeDatabaseConnectionTimeout',
    environmentVariables: [
      'DATABASE_CONNECTION_TIMEOUT',
      'DATABASE_WRITE_CONNECTION_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_CONNECTION_TIMEOUT',
        'process.env.DATABASE_WRITE_CONNECTION_TIMEOUT',
      ],
    },
  },
  writeDatabaseRequestTimeout: {
    name: 'writeDatabaseRequestTimeout',
    environmentVariables: [
      'DATABASE_REQUEST_TIMEOUT',
      'DATABASE_WRITE_REQUEST_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_REQUEST_TIMEOUT',
        'process.env.DATABASE_WRITE_REQUEST_TIMEOUT',
      ],
    },
  },
  writeDatabaseEncryptionDisabledEnv: {
    name: 'writeDatabaseEncryptionDisabledEnv',
    environmentVariables: [
      'DATABASE_ENCRYPTION_DISABLED',
      'DATABASE_WRITE_ENCRYPTION_DISABLED',
    ],
    defaultValues: {
      or: [
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === '1'",
        "process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === '1'",
      ],
    },
  },
  eventInfo: {
    name: 'eventInfo',
    environmentVariables: [
      'DATABASE_DISABLED',
      'DATABASE_WRITE_DISABLED',
      'DATABASE_URI',
      'DATABASE_WRITE_URI',
      'DATABASE_CONNECTION_TYPE',
      'DATABASE_WRITE_CONNECTION_TYPE',
      'DATABASE_NAME',
      'DATABASE_WRITE_NAME',
      'DATABASE_HOST',
      'DATABASE_WRITE_HOST',
      'DATABASE_PORT',
      'DATABASE_WRITE_PORT',
      'DATABASE_USER',
      'DATABASE_WRITE_USER',
      'DATABASE_PASSWORD',
      'DATABASE_WRITE_PASSWORD',
    ],
    defaultValues: {
      if: {
        or: [
          "process.env.DATABASE_DISABLED.toLowerCase() === 'true'",
          "process.env.DATABASE_DISABLED.toLowerCase() === '1'",
          "process.env.DATABASE_WRITE_DISABLED.toLowerCase() === 'true'",
          "process.env.DATABASE_WRITE_DISABLED.toLowerCase() === '1'",
        ],
      },
      then: 'undefined',
      else: {
        uri: {
          or: ['process.env.DATABASE_URI', 'process.env.DATABASE_WRITE_URI'],
        },
        connectionType: {
          or: [
            'process.env.DATABASE_CONNECTION_TYPE',
            'process.env.DATABASE_WRITE_CONNECTION_TYPE',
          ],
        },
        options: {
          if: 'writeDatabaseOptions',
          then: 'JSON.parse(writeDatabaseOptions)',
          else: 'writeDatabaseEncryptionDisabled',
        },
        database: {
          or: [
            'process.env.DATABASE_NAME',
            'process.env.DATABASE_WRITE_NAME',
            'write',
          ],
        },
        host: {
          or: ['process.env.DATABASE_HOST', 'process.env.DATABASE_WRITE_HOST'],
        },
        port: {
          or: ['process.env.DATABASE_USER', 'process.env.DATABASE_WRITE_USER'],
        },
        password: {
          or: [
            'process.env.DATABASE_PASSWORD',
            'process.env.DATABASE_WRITE_PASSWORD',
          ],
        },
        ssl: 'writeDatabaseSSL',
        connectionTimeout: 'writeDatabaseConnectionTimeoutNumber',
        requestTimeout: 'writeDatabaseRequestTimeoutNumber',
      },
    },
  },
  readDatabaseOptions: {
    name: 'readDatabaseOptions',
    environmentVariables: ['DATABASE_OPTIONS', 'DATABASE_READ_OPTIONS'],
    defaultValues: {
      or: ['process.env.DATABASE_OPTIONS', 'process.env.DATABASE_READ_OPTIONS'],
    },
  },
  readDatabaseSSLEnv: {
    name: 'readDatabaseSSLEnv',
    environmentVariables: ['DATABASE_SSL', 'DATABASE_READ_SSL'],
    defaultValues: {
      or: [
        'process.env.DATABASE_SSL',
        'process.env.DATABASE_READ_SSL',
        "'false'",
      ],
    },
  },
  readDatabaseConnectionTimeout: {
    name: 'readDatabaseConnectionTimeout',
    environmentVariables: [
      'DATABASE_CONNECTION_TIMEOUT',
      'DATABASE_READ_CONNECTION_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_CONNECTION_TIMEOUT',
        'process.env.DATABASE_READ_CONNECTION_TIMEOUT',
      ],
    },
  },
  readDatabaseRequestTimeout: {
    name: 'readDatabaseRequestTimeout',
    environmentVariables: [
      'DATABASE_REQUEST_TIMEOUT',
      'DATABASE_READ_REQUEST_TIMEOUT',
    ],
    defaultValues: {
      or: [
        'process.env.DATABASE_REQUEST_TIMEOUT',
        'process.env.DATABASE_READ_REQUEST_TIMEOUT',
      ],
    },
  },
  readDatabaseEncryptionDisabledEnv: {
    name: 'readDatabaseEncryptionDisabledEnv',
    environmentVariables: [
      'DATABASE_ENCRYPTION_DISABLED',
      'DATABASE_READ_ENCRYPTION_DISABLED',
    ],
    defaultValues: {
      or: [
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === '1'",
        "process.env.DATABASE_READ_ENCRYPTION_DISABLED.toLowerCase() === 'true'",
        "process.env.DATABASE_READ_ENCRYPTION_DISABLED.toLowerCase() === '1'",
      ],
    },
  },
  readInfo: {
    name: 'readInfo',
    environmentVariables: [
      'DATABASE_DISABLED',
      'DATABASE_READ_DISABLED',
      'DATABASE_URI',
      'DATABASE_READ_URI',
      'DATABASE_CONNECTION_TYPE',
      'DATABASE_READ_CONNECTION_TYPE',
      'DATABASE_NAME',
      'DATABASE_READ_NAME',
      'DATABASE_HOST',
      'DATABASE_READ_HOST',
      'DATABASE_PORT',
      'DATABASE_READ_PORT',
      'DATABASE_USER',
      'DATABASE_READ_USER',
      'DATABASE_PASSWORD',
      'DATABASE_READ_PASSWORD',
    ],
    defaultValues: {
      if: {
        or: [
          "process.env.DATABASE_DISABLED.toLowerCase() === 'true'",
          "process.env.DATABASE_DISABLED.toLowerCase() === '1'",
          "process.env.DATABASE_READ_DISABLED.toLowerCase() === 'true'",
          "process.env.DATABASE_READ_DISABLED.toLowerCase() === '1'",
        ],
      },
      then: 'undefined',
      else: {
        uri: {
          or: ['process.env.DATABASE_URI', 'process.env.DATABASE_READ_URI'],
        },
        connectionType: {
          or: [
            'process.env.DATABASE_CONNECTION_TYPE',
            'process.env.DATABASE_READ_CONNECTION_TYPE',
          ],
        },
        options: {
          if: 'readDatabaseOptions',
          then: 'JSON.parse(readDatabaseOptions)',
          else: 'readDatabaseEncryptionDisabled',
        },
        database: {
          or: [
            'process.env.DATABASE_NAME',
            'process.env.DATABASE_READ_NAME',
            'read',
          ],
        },
        host: {
          or: ['process.env.DATABASE_HOST', 'process.env.DATABASE_READ_HOST'],
        },
        port: {
          or: ['process.env.DATABASE_USER', 'process.env.DATABASE_READ_USER'],
        },
        password: {
          or: [
            'process.env.DATABASE_PASSWORD',
            'process.env.DATABASE_READ_PASSWORD',
          ],
        },
        ssl: 'readDatabaseSSL',
        connectionTimeout: 'readDatabaseConnectionTimeoutNumber',
        requestTimeout: 'readDatabaseRequestTimeoutNumber',
      },
    },
  },
};

test('Test Simple File', async () => {
  const file = await readFile('./test/sample0.ts', 'utf8');
  expect(file.length).toBe(2898);
  const vars = Parser.getSpecialVariables(file);
  expect(vars).toMatchObject(expVars0);
});

test('Test File', async () => {
  const file = await readFile('./test/sample1.ts', 'utf8');
  expect(file.length).toBe(6791);
  const vars = Parser.getSpecialVariables(file);
  expect(vars).toMatchObject(expVars1);
});
