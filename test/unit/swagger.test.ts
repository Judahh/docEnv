import { Generator } from '../../source/generator';
import { SwaggerGenerator } from '../../source/swaggerGenerator';

// const gen0 = {
//   path1Name: {
//     path: '/path1',
//     name: 'path1Name',
//     controller: 'AController',
//     controllerPath: '../controllers/aController',
//     methods: {
//       create: {
//         input: {
//           token: { or: ['string', 'undefined'] },
//           key: { or: ['string', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           level: { or: ['string', 'undefined'] },
//           c3: { or: ['string', 'undefined'] },
//         },
//         output: {
//           token: { or: ['string', 'undefined'] },
//           key: { or: ['string', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           level: { or: ['string', 'undefined'] },
//           c4: { or: ['string', 'undefined'] },
//         },
//         ...createBase,
//       },
//       update: {
//         filter: {
//           token: { or: ['string', 'undefined'] },
//           key: { or: ['string', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           level: { or: ['string', 'undefined'] },
//           u2: { or: ['string', 'undefined'] },
//         },
//         input: {
//           token: { or: ['string', 'undefined'] },
//           key: { or: ['string', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           level: { or: ['string', 'undefined'] },
//           u3: { or: ['string', 'undefined'] },
//         },
//         output: {
//           token: { or: ['string', 'undefined'] },
//           u4: { or: ['string', 'undefined'] },
//         },
//         ...updateBase,
//       },
//     },
//     service: 'AService',
//   },
//   path2Name: {
//     path: '/path1/path2',
//     name: 'path2Name',
//     controller: 'BController',
//     controllerPath: '../controllers/bController',
//     methods: {
//       create: {
//         input: {
//           name: 'string',
//           levelId: 'number',
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//           test: {
//             or: [
//               { id: 'number', name: 'string', levelId: 'number' },
//               'undefined',
//             ],
//           },
//         },
//         ...createBase,
//       },
//       read: {
//         filter: {
//           id: { or: ['number', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           tests: { array: 'number' },
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//           test: {
//             or: [
//               { id: 'number', name: 'string', levelId: 'number' },
//               'undefined',
//             ],
//           },
//         },
//         ...readBase,
//       },
//       delete: {
//         filter: {
//           id: { or: ['number', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           tests: { array: 'number' },
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//           test: {
//             or: [
//               { id: 'number', name: 'string', levelId: 'number' },
//               'undefined',
//             ],
//           },
//         },
//         ...deleteBase,
//       },
//       update: {
//         filter: {
//           id: { or: ['number', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//           tests: { array: 'number' },
//         },
//         input: {
//           name: 'string',
//           levelId: 'number',
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//           test: {
//             or: [
//               { id: 'number', name: 'string', levelId: 'number' },
//               'undefined',
//             ],
//           },
//         },
//         ...updateBase,
//       },
//     },
//     service: 'BService',
//   },
//   path3Name: {
//     path: '/path3',
//     name: 'path3Name',
//     controller: 'CController',
//     controllerPath: '../controllers/cController',
//     methods: {
//       create: {
//         input: {
//           name: 'string',
//           levelId: 'number',
//           el: { and: [{ a: 'number' }, { b: 'number' }] },
//           el2: { or: [{ a: 'number' }, { b: 'number' }] },
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//         },
//         ...createBase,
//       },
//       read: {
//         filter: {
//           id: { or: ['number', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//         },
//         ...readBase,
//       },
//       delete: {
//         filter: {
//           id: { or: ['number', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//         },
//         ...deleteBase,
//       },
//       update: {
//         filter: {
//           id: { or: ['number', 'undefined'] },
//           name: { or: ['string', 'undefined'] },
//           levelId: { or: ['number', 'undefined'] },
//         },
//         input: {
//           name: 'string',
//           levelId: 'number',
//           el: { and: [{ a: 'number' }, { b: 'number' }] },
//           el2: { or: [{ a: 'number' }, { b: 'number' }] },
//         },
//         output: {
//           id: 'number',
//           name: 'string',
//           levelId: 'number',
//         },
//         ...updateBase,
//       },
//     },
//     service: 'CService',
//   },
// };

test('Test Simple File', async () => {
  const path = './test/sampleAPI';
  const gen = await Generator.generate(path);
  const gen0 = await SwaggerGenerator.generate(gen);
  console.log(gen0);
  console.log(
    gen0?.paths?.['/path1']?.post?.requestBody?.content?.['application/json']?.schema
  );
  console.log(gen0?.components?.schemas);
});
