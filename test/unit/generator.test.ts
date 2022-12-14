import { Generator } from '../../source/generator';

const createBase = {
  http: ['post'],
};

const readBase = {
  http: ['get'],
};

const updateBase = {
  http: ['put', 'patch'],
};

const deleteBase = {
  http: ['delete'],
};

const gen0 = {
  path1Name: {
    path: '/path1',
    name: 'path1Name',
    controller: 'AController',
    controllerPath: '../controllers/aController',
    methods: {
      create: {
        description: 'Create A',
        input: {
          description: 'Input for creating A',
          value: {
            token: { or: ['string', 'undefined'] },
            key: { or: ['string', 'undefined'] },
            name: {
              description: 'Name of A',
              value: { or: ['string', 'undefined'] },
            },
            levelId: { or: ['number', 'undefined'] },
            level: { or: ['string', 'undefined'] },
            c3: { or: ['string', 'undefined'] },
          },
        },
        output: {
          token: { or: ['string', 'undefined'] },
          key: { or: ['string', 'undefined'] },
          name: { or: ['string', 'undefined'] },
          levelId: { or: ['number', 'undefined'] },
          level: { or: ['string', 'undefined'] },
          c4: { or: ['string', 'undefined'] },
        },
        ...createBase,
      },
      update: {
        filter: {
          token: { or: ['string', 'undefined'] },
          key: { or: ['string', 'undefined'] },
          name: { or: ['string', 'undefined'] },
          levelId: { or: ['number', 'undefined'] },
          level: { or: ['string', 'undefined'] },
          u0: { or: ['string', 'undefined'] },
        },
        input: {
          token: { or: ['string', 'undefined'] },
          key: { or: ['string', 'undefined'] },
          name: { or: ['string', 'undefined'] },
          levelId: { or: ['number', 'undefined'] },
          level: { or: ['string', 'undefined'] },
          u1: { or: ['string', 'undefined'] },
        },
        output: {
          token: 'string',
          key: { or: ['string', 'undefined'] },
          name: {
            description: 'Name of A',
            value: { or: ['string', 'undefined'] },
          },
          levelId: { or: ['number', 'undefined'] },
          level: { or: ['string', 'undefined'] },
          d2: { or: ['string', 'undefined'] },
        },
        ...updateBase,
      },
    },
    service: 'AService',
  },
  path2Name: {
    path: '/path1/path2',
    name: 'path2Name',
    controller: 'BController',
    controllerPath: '../controllers/bController',
    methods: {
      create: {
        input: {
          name: 'string',
          levelId: {
            description: 'LevelId of B',
            examples: [1],
            value: 'number',
          },
        },
        output: {
          id: { description: 'Id of B', examples: [1, 2], value: 'number' },
          name: { description: 'Base Name of B', value: 'string' },
          levelId: 'number',
          test: {
            or: [
              { id: 'number', name: 'string', levelId: 'number' },
              'undefined',
            ],
          },
        },
        ...createBase,
      },
      read: {
        filter: {
          id: { or: ['number', 'undefined'] },
          name: { or: ['string', 'undefined'] },
          levelId: { or: ['number', 'undefined'] },
          tests: { array: 'number' },
        },
        output: {
          id: { description: 'Id of B', examples: [1, 2], value: 'number' },
          name: { description: 'Base Name of B', value: 'string' },
          levelId: 'number',
          test: {
            or: [
              { id: 'number', name: 'string', levelId: 'number' },
              'undefined',
            ],
          },
        },
        ...readBase,
      },
      delete: {
        filter: {
          id: { or: ['number', 'undefined'] },
          name: { or: ['string', 'undefined'] },
          levelId: { or: ['number', 'undefined'] },
          tests: { array: 'number' },
        },
        output: {
          id: { description: 'Id of B', examples: [1, 2], value: 'number' },
          name: { description: 'Base Name of B', value: 'string' },
          levelId: 'number',
          test: {
            or: [
              { id: 'number', name: 'string', levelId: 'number' },
              'undefined',
            ],
          },
        },
        ...deleteBase,
      },
      update: {
        filter: {
          id: { or: ['number', 'undefined'] },
          name: { or: ['string', 'undefined'] },
          levelId: { or: ['number', 'undefined'] },
          tests: { array: 'number' },
        },
        input: {
          name: 'string',
          levelId: {
            description: 'LevelId of B',
            examples: [1],
            value: 'number',
          },
        },
        output: {
          id: { description: 'Id of B', examples: [1, 2], value: 'number' },
          name: { description: 'Base Name of B', value: 'string' },
          levelId: 'number',
          test: {
            or: [
              { id: 'number', name: 'string', levelId: 'number' },
              'undefined',
            ],
          },
        },
        ...updateBase,
      },
    },
    service: 'BService',
  },
  path3Name: {
    path: '/path3',
    name: 'path3Name',
    controller: 'CController',
    controllerPath: '../controllers/cController',
    methods: {
      create: {
        input: {
          name: 'string',
          levelId: 'number',
          el: { and: [{ a: 'number' }, { b: 'number' }] },
          el2: { or: [{ a: 'number' }, { b: 'number' }] },
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
        },
        ...createBase,
      },
      read: {
        filter: {
          id: {
            description: 'Id of C',
            value: { or: ['number', 'undefined'] },
          },
          name: {
            description: 'Name of C',
            value: { or: ['string', 'undefined'] },
          },
          levelId: {
            description: 'LevelId of C',
            value: { or: ['number', 'undefined'] },
          },
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
        },
        ...readBase,
      },
      delete: {
        description: 'Delete C',
        filter: {
          id: {
            description: 'Id of C',
            value: { or: ['number', 'undefined'] },
          },
          name: {
            description: 'Name of C',
            value: { or: ['string', 'undefined'] },
          },
          levelId: {
            description: 'LevelId of C',
            value: { or: ['number', 'undefined'] },
          },
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
        },
        ...deleteBase,
      },
      update: {
        filter: {
          id: {
            description: 'Id of C',
            value: { or: ['number', 'undefined'] },
          },
          name: {
            description: 'Name of C',
            value: { or: ['string', 'undefined'] },
          },
          levelId: {
            description: 'LevelId of C',
            value: { or: ['number', 'undefined'] },
          },
        },
        input: {
          name: 'string',
          levelId: 'number',
          el: { and: [{ a: 'number' }, { b: 'number' }] },
          el2: { or: [{ a: 'number' }, { b: 'number' }] },
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
        },
        ...updateBase,
      },
    },
    service: 'CService',
  },
};

test('Test Simple File', async () => {
  const path = './test/sampleAPI';
  // console.log('path', path);
  const gen = await Generator.generate(path);
  console.log('received gen:', JSON.stringify(gen, null, 5));
  expect(gen).toMatchObject(gen0);
});
