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
        filter: {
          token: ['string', 'undefined'],
          key: ['string', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
          level: ['string', 'undefined'],
          c2: ['string', 'undefined'],
        },
        input: {
          token: ['string', 'undefined'],
          key: ['string', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
          level: ['string', 'undefined'],
          c3: ['string', 'undefined'],
        },
        output: {
          token: ['string', 'undefined'],
          key: ['string', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
          level: ['string', 'undefined'],
          c4: ['string', 'undefined'],
        },
        ...createBase,
      },
      update: {
        filter: {
          token: ['string', 'undefined'],
          key: ['string', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
          level: ['string', 'undefined'],
          u2: ['string', 'undefined'],
        },
        input: {
          token: ['string', 'undefined'],
          key: ['string', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
          level: ['string', 'undefined'],
          u3: ['string', 'undefined'],
        },
        output: {
          token: ['string', 'undefined'],
          u4: ['string', 'undefined'],
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
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
        },
        ...createBase,
      },
      read: {
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
        },
        ...readBase,
      },
      delete: {
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
        },
        ...deleteBase,
      },
      update: {
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
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
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
        },
        ...createBase,
      },
      read: {
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
        },
        ...readBase,
      },
      delete: {
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
        },
        output: {
          id: 'number',
          name: 'string',
          levelId: 'number',
          test: [
            { id: 'number', name: 'string', levelId: 'number' },
            'undefined',
          ],
        },
        ...deleteBase,
      },
      update: {
        filter: {
          id: ['number', 'undefined'],
          name: ['string', 'undefined'],
          levelId: ['number', 'undefined'],
        },
        input: {
          name: 'string',
          levelId: 'number',
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
  const gen = await Generator.generate(path);
  expect(gen).toMatchObject(gen0);
});
