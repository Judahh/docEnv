import { Extractor } from '../../source/extractor';

const noGrouping0 = { if: 'a', then: 'b', else: 'c' };
const noGrouping1 = { if: 'b', then: 'c', else: 'd' };
const noGrouping2 = { if: 'c', then: 'd', else: 'e' };
const noGrouping3 = { if: 'd', then: 'e', else: 'f' };
const noGrouping4 = { if: 'r', then: 's', else: 't' };

const or0 = { or: ['a', 'b', 'c'] };
const or1 = { or: ['b', 'c', 'd'] };
const or2 = { or: ['c', 'd', 'e'] };
const or3 = { or: ['d', 'e', 'f'] };
// const or4 = { or: ['e', 'f', 'g'] };
// const or5 = { or: ['f', 'g', 'h'] };
// const or6 = { or: ['g', 'h', 'i'] };
const or7 = { or: ['h', 'i', 'j'] };
// const or8 = { and: ['m', 'n', 'o'] };
const or9 = { or: ['v', 'x', 'z'] };

// const and0 = { and: ['a', 'b', 'c'] };
// const and1 = { and: ['b', 'c', 'd'] };
// const and2 = { and: ['c', 'd', 'e'] };
// const and3 = { and: ['d', 'e', 'f'] };
// const and4 = { and: ['e', 'f', 'g'] };
// const and5 = { and: ['f', 'g', 'h'] };
// const and6 = { and: ['g', 'h', 'i'] };
// const and7 = { and: ['h', 'i', 'j'] };
const and8 = { and: ['m', 'n', 'o'] };
// const and9 = { and: ['v', 'x', 'z'] };

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
  g: or7,
  l: and8,
  p: noGrouping4,
  u: or9,
  w: 'k',
};

const compGrouping = {
  if: or2,
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
  if: or0,
  then: 'd',
  else: 'e',
};

const middleOption = {
  if: 'a',
  then: or1,
  else: 'e',
};

const backOption = {
  if: 'a',
  then: 'b',
  else: or2,
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

// test('Test Ternary Basic', async () => {
//   let ternary;
//   ternary = Extractor.extract('a?b:c ;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a?b:c');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a?b:c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a ?b:c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a?b :c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a? b:c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract(' a?b:c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a? b :c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract(' a ? b : c ;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract(' a ?b: c ;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('a?b: c ;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract(' a ?b:c;');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('(a?b:c)');
//   expect(ternary).toMatchObject(noGrouping0);
//   ternary = Extractor.extract('(a)?(b):(c)');
//   expect(ternary).toMatchObject(noGrouping0);
// });

// test('Test Ternary Large With Groups', async () => {
//   let ternary;
//   ternary = Extractor.extract('a ? (b ? c : d) : e;');
//   expect(ternary).toMatchObject(middleGrouping);
//   ternary = Extractor.extract('(a ? b : c) ? d : e');
//   expect(ternary).toMatchObject(frontGrouping);
//   ternary = Extractor.extract('a ? b : (c ? d : e)');
//   expect(ternary).toMatchObject(backGrouping);
// });

test('Test Ternary Large With Options', async () => {
  let ternary;
  ternary = Extractor.extract('a || b || c ? d : e;');
  expect(ternary).toMatchObject(frontOption);
  ternary = Extractor.extract('a ? b || c || d : e');
  expect(ternary).toMatchObject(middleOption);
  ternary = Extractor.extract('a ? b : c || d || e');
  expect(ternary).toMatchObject(backOption);
});

// test('Test Ternary Large With Object', async () => {
//   let ternary;
//   ternary = Extractor.extract('{a: 1, b: 2, c: 3} ? d : e;');
//   expect(ternary).toMatchObject(frontObject);
//   ternary = Extractor.extract('a ? {b: 1, c: 2, d: 3} : e');
//   expect(ternary).toMatchObject(middleObject);
//   ternary = Extractor.extract('a ? b : {c: 1, d: 2, e: 3}');
//   expect(ternary).toMatchObject(backObject);
// });

// test('Test Ternary Large Without Groups', async () => {
//   let ternary;
//   ternary = Extractor.extract('a ? b ? c : d : e');
//   expect(ternary).toMatchObject(middleGrouping);
//   ternary = Extractor.extract(' a ? b : c ? d : e');
//   expect(ternary).toMatchObject(backGrouping);
// });

// test('Test Options Basic', async () => {
//   let options;
//   options = Extractor.extract('a || b || c || d && e');
//   expect(options).toMatchObject({ or: ['a', 'b', 'c', { and: ['d', 'e'] }] });
//   options = Extractor.extract('a || b || c || d || e');
//   expect(options).toMatchObject({ or: ['a', 'b', 'c', 'd', 'e'] });
//   options = Extractor.extract('a && b && c && d || e');
//   expect(options).toMatchObject({ or: [{ and: ['a', 'b', 'c', 'd'] }, 'e'] });
//   options = Extractor.extract('a && b && c && d && e');
//   expect(options).toMatchObject({ and: ['a', 'b', 'c', 'd', 'e'] });
// });

// test('Test Options', async () => {
//   let options;
//   options =
//     Extractor.extract(`process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
//   process.env.DATABASE_ENCRYPTION_DISABLED?.toLowerCase() === '1' ||
//   process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === 'true' ||
//   process.env.DATABASE_WRITE_ENCRYPTION_DISABLED?.toLowerCase() === '1'`);
//   expect(options).toMatchObject({
//     or: [
//       `process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === 'true'`,
//       `process.env.DATABASE_ENCRYPTION_DISABLED.toLowerCase() === '1'`,
//       `process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === 'true'`,
//       `process.env.DATABASE_WRITE_ENCRYPTION_DISABLED.toLowerCase() === '1'`,
//     ],
//   });
//   options = Extractor.extract('a || b || c ? d : e ');
//   expect(options).toMatchObject({
//     if: or0,
//     then: 'd',
//     else: 'e',
//   });
//   options = Extractor.extract('a || b || ( c ? d : e )');
//   expect(options).toMatchObject({
//     or: ['a', 'b', noGrouping2],
//   });
//   options = Extractor.extract('a || b || { c: 1, d: 2, e: 3 }');
//   expect(options).toMatchObject({
//     or: ['a', 'b', object2],
//   });
// });

// test('Test Object', async () => {
//   let options = Extractor.extract('{ a: 1, b: 2, c: 3 }');
//   expect(options).toMatchObject(object0);
//   options = Extractor.extract('{ a: { b: 1, c: 2, d: 3 }, e: 4, f: 5 }');
//   expect(options).toMatchObject({ a: object1, e: 4, f: 5 });
//   options = Extractor.extract('{ a: 0, b: { c: 1, d: 2, e: 3 }, f: 4 }');
//   expect(options).toMatchObject({ a: 0, b: object2, f: 4 });
//   options = Extractor.extract('{ a: -1, b: 0, c: { d: 1, e: 2, f: 3 } }');
//   expect(options).toMatchObject({ a: -1, b: 0, c: object3 });
//   options = Extractor.extract('{ a: b || c || d, e: 2, f: 3 }');
//   expect(options).toMatchObject({ a: or1, e: 2, f: 3 });
//   options = Extractor.extract('{ a: 1, b: c || d || e, f: 3 }');
//   expect(options).toMatchObject({ a: 1, b: or2, f: 3 });
//   options = Extractor.extract('{ a: 1, b: 2, c: d || e || f }');
//   expect(options).toMatchObject({ a: 1, b: 2, c: or3 });
//   options = Extractor.extract('{ a: 1, b: 2, c: d ? e : f }');
//   expect(options).toMatchObject({
//     a: 1,
//     b: 2,
//     c: noGrouping3,
//   });
// });

// test('Complex', async () => {
//   let options = Extractor.extract(
//     '{ g: h || i || j, l: m && n && o, p: r ? s : t , u: v || x || z, w: k }'
//   );
//   expect(options).toMatchObject(compObject);
//   options = Extractor.extract(
//     '{ c || d || e ? f : { g: h || i || j, l: m && n && o, p: r ? s : t , u: v || x || z, w: k }}'
//   );
//   expect(options).toMatchObject(compGrouping);
//   options = Extractor.extract(
//     '{ b: { c || d || e ? f : { g: h || i || j, l: m && n && o, p: r ? s : t , u: v || x || z, w: k }}}'
//   );
//   expect(options).toMatchObject(comp1Grouping);
//   options = Extractor.extract(
//     '{ a: { b: { c || d || e ? f : { g: h || i || j, l: m && n && o, p: r ? s : t , u: v || x || z, w: k }}}}'
//   );
//   expect(options).toMatchObject(comp2Grouping);
// });
