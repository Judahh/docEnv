import { Extractor } from '../../source/extractor';

const noGrouping0 = { if: 'a', then: 'b', else: 'c' };
const noGrouping1 = { if: 'b', then: 'c', else: 'd' };
const noGrouping2 = { if: 'c', then: 'd', else: 'e' };
const noGrouping3 = { if: 'r', then: 's', else: 't' };

const option0 = { or: ['a', 'b', 'c'] };
const option1 = { or: ['b', 'c', 'd'] };
const option2 = { or: ['c', 'd', 'e'] };
const option3 = { or: ['h', 'i', 'j'] };
const option4 = { and: ['m', 'n', 'o'] };
const option5 = { or: ['v', 'x', 'z'] };

const object0 = { a: 1, b: 2, c: 3 };
const object1 = { b: 1, c: 2, d: 3 };
const object2 = { c: 1, d: 2, e: 3 };
const object3 = { d: 1, e: 2, f: 3 };

const frontGrouping = {
  if: noGrouping0,
  then: 'd',
  else: 'e',
};

const middleGrouping = {
  if: 'a',
  then: noGrouping1,
  else: 'e',
};

const backGrouping = {
  if: 'a',
  then: 'b',
  else: noGrouping2,
};

const compObject = {
  g: option3,
  l: option4,
  p: noGrouping3,
  u: option5,
  w: 'k',
};

const compGrouping = {
  if: option2,
  then: 'f',
  else: compObject,
};

const comp1Grouping = {
  b: compGrouping,
};

const comp2Grouping = {
  a: comp1Grouping,
};

const frontOption = {
  if: option0,
  then: 'd',
  else: 'e',
};

const middleOption = {
  if: 'a',
  then: option1,
  else: 'e',
};

const backOption = {
  if: 'a',
  then: 'b',
  else: option2,
};

const frontObject = {
  if: object0,
  then: 'd',
  else: 'e',
};

const middleObject = {
  if: 'a',
  then: object1,
  else: 'e',
};

const backObject = {
  if: 'a',
  then: 'b',
  else: object2,
};

test('Test Ternary Basic', async () => {
  let ternary = Extractor.extract('a?b:c ;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a?b:c');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a?b:c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a ?b:c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a?b :c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a? b:c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract(' a?b:c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a? b :c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract(' a ? b : c ;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract(' a ?b: c ;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('a?b: c ;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract(' a ?b:c;');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('(a?b:c)');
  expect(ternary).toMatchObject(noGrouping0);
  ternary = Extractor.extract('(a)?(b):(c)');
  expect(ternary).toMatchObject(noGrouping0);
});

test('Test Ternary Large With Groups', async () => {
  let ternary = Extractor.extract('a ? (b ? c : d) : e;');
  expect(ternary).toMatchObject(middleGrouping);
  ternary = Extractor.extract('(a ? b : c) ? d : e');
  expect(ternary).toMatchObject(frontGrouping);
  ternary = Extractor.extract('a ? b : (c ? d : e)');
  expect(ternary).toMatchObject(backGrouping);
});

test('Test Ternary Large With Options', async () => {
  let ternary = Extractor.extract('a || b || c ? d : e;');
  expect(ternary).toMatchObject(frontOption);
  ternary = Extractor.extract('a ? b || c || d : e');
  expect(ternary).toMatchObject(middleOption);
  ternary = Extractor.extract('a ? b : c || d || e');
  expect(ternary).toMatchObject(backOption);
});

test('Test Ternary Large With Object', async () => {
  let ternary = Extractor.extract('{a: 1, b: 2, c: 3} ? d : e;');
  expect(ternary).toMatchObject(frontObject);
  ternary = Extractor.extract('a ? {b: 1, c: 2, d: 3} : e');
  expect(ternary).toMatchObject(middleObject);
  ternary = Extractor.extract('a ? b : {c: 1, d: 2, e: 3}');
  expect(ternary).toMatchObject(backObject);
});

test('Test Ternary Large Without Groups', async () => {
  let ternary = Extractor.extract('a ? b ? c : d : e');
  expect(ternary).toMatchObject(middleGrouping);
  ternary = Extractor.extract(' a ? b : c ? d : e');
  expect(ternary).toMatchObject(backGrouping);
});

test('Test Options Basic', async () => {
  let options = Extractor.extract('a || b || c || d && e');
  expect(options).toMatchObject({ or: ['a', 'b', 'c', { and: ['d', 'e'] }] });
  options = Extractor.extract('a || b || c || d || e');
  expect(options).toMatchObject({ or: ['a', 'b', 'c', 'd', 'e'] });
  options = Extractor.extract('a && b && c && d || e');
  expect(options).toMatchObject({ or: [{ and: ['a', 'b', 'c', 'd'] }, 'e'] });
  options = Extractor.extract('a && b && c && d && e');
  expect(options).toMatchObject({ and: ['a', 'b', 'c', 'd', 'e'] });
});

test('Test Options', async () => {
  const options =
    Extractor.extract(`process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === '1' ||
  process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
  process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === '1'`);
  expect(options).toMatchObject({
    or: [
      `process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === 'true'`,
      `process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === '1'`,
      `process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === 'true'`,
      `process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === '1'`,
    ],
  });
});

test('Test Object', async () => {
  let options = Extractor.extract('{ a: 1, b: 2, c: 3 }');
  expect(options).toMatchObject(object0);
  options = Extractor.extract('{ a: { b: 1, c: 2, d: 3 }, e: 4, f: 5 }');
  expect(options).toMatchObject({ a: object1, e: 4, f: 5 });
  options = Extractor.extract('{ a: 0, b: { c: 1, d: 2, e: 3 }, f: 4 }');
  expect(options).toMatchObject({ a: 0, b: object2, f: 4 });
  options = Extractor.extract('{ a: -1, b: 0, c: { d: 1, e: 2, f: 3 } }');
  expect(options).toMatchObject({ a: -1, b: 0, c: object3 });
  options = Extractor.extract('{ a: b || c || d, e: 2, f: 3 }');
  expect(options).toMatchObject({ a: option1, e: 2, f: 3 });
  options = Extractor.extract('{ a: 1, b: c || d || e, f: 3 }');
  expect(options).toMatchObject({ a: 1, b: option2, f: 3 });
  // options = Extractor.extract('{ a: 1, b: 2, c: d || e || f }');
  // expect(options).toMatchObject({ a: 1, b: 2, c: option3 });
});

// test('Complex', async () => {
//   let options = Extractor.extract(
//     '{ g: { or: [h, i, j] }, l: { and: [m, n, o] }, p: { if: r, then: s, else: t }, u: { or: [v, x, z] }, w: k}'
//   );
//   expect(options).toMatchObject(compObject);
//   options = Extractor.extract(
//     '{ if: { or: [c, d, e] }, then: f, else: { g: { or: [h, i, j] }, l: { and: [m, n, o] }, p: { if: r, then: s, else: t }, u: { or: [v, x, z] }, w: k}}'
//   );
//   expect(options).toMatchObject(compGrouping);
//   options = Extractor.extract(
//     '{ b: { if: { or: [c, d, e] }, then: f, else: { g: { or: [h, i, j] }, l: { and: [m, n, o] }, p: { if: r, then: s, else: t }, u: { or: [v, x, z] }, w: k,},}}'
//   );
//   expect(options).toMatchObject(comp1Grouping);
//   options = Extractor.extract(
//     '{ a: { b: { if: { or: [c, d, e] }, then: f, else: { g: { or: [h, i, j] }, l: { and: [m, n, o] }, p: { if: r, then: s, else: t }, u: { or: [v, x, z] }, w: k,},}}}'
//   );
//   expect(options).toMatchObject(comp2Grouping);
// });
