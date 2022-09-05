import { Extractor } from '../../source/extractor';

const noGrouping0 = { if: 'a', then: 'b', else: 'c' };
const noGrouping1 = { if: 'b', then: 'c', else: 'd' };
const noGrouping2 = { if: 'c', then: 'd', else: 'e' };

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
  console.log(ternary);
  expect(ternary).toMatchObject(middleGrouping);
  ternary = Extractor.extract('(a ? b : c) ? d : e');
  console.log(ternary);
  expect(ternary).toMatchObject(frontGrouping);
  ternary = Extractor.extract('a ? b : (c ? d : e)');
  console.log(ternary);
  expect(ternary).toMatchObject(backGrouping);
});

test('Test Ternary Large Without Groups', async () => {
  let ternary = Extractor.extract('a ? b ? c : d : e');
  console.log(ternary);
  expect(ternary).toMatchObject(middleGrouping);
  ternary = Extractor.extract(' a ? b : c ? d : e');
  console.log(ternary);
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
