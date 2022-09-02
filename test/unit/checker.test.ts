import { Checker } from '../../source/checker';
test('Test Ternary Basic', async () => {
  let ternary = Checker.checkOptions('a?b:c ;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a?b:c');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a?b:c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a ?b:c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a?b :c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a? b:c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions(' a?b:c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a? b :c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions(' a ? b : c ;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions(' a ?b: c ;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions('a?b: c ;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
  ternary = Checker.checkOptions(' a ?b:c;');
  expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
});

test('Test Ternary Large With Groups', async () => {
  let ternary = Checker.checkOptions('a ? (b ? c : d) : e;');
  expect(ternary).toMatchObject({
    if: 'a',
    then: { if: 'b', then: 'c', else: 'd' },
    else: 'e',
  });
  ternary = Checker.checkOptions('(a ? b : c) ? d : e');
  expect(ternary).toMatchObject({
    if: { if: 'a', then: 'b', else: 'c' },
    then: 'd',
    else: 'e',
  });
  ternary = Checker.checkOptions('a ? b : (c ? d : e)');
  expect(ternary).toMatchObject({
    if: 'a',
    then: 'b',
    else: { if: 'c', then: 'd', else: 'e' },
  });
});

test('Test Ternary Large Without Groups', async () => {
  let ternary = Checker.checkOptions('a ? b ? c : d : e');
  expect(ternary).toMatchObject({
    if: 'a',
    then: { if: 'b', then: 'c', else: 'd' },
    else: 'e',
  });
  ternary = Checker.checkOptions(' a ? b : c ? d : e');
  expect(ternary).toMatchObject({
    if: 'a',
    then: 'b',
    else: { if: 'c', then: 'd', else: 'e' },
  });
});

test('Test Options Basic', async () => {
  let options = Checker.checkOptions('a || b || c || d && e');
  expect(options).toMatchObject({ or: ['a', 'b', 'c', { and: ['d', 'e'] }] });
  options = Checker.checkOptions('a || b || c || d || e');
  expect(options).toMatchObject({ or: ['a', 'b', 'c', 'd', 'e'] });
  options = Checker.checkOptions('a && b && c && d || e');
  expect(options).toMatchObject({ or: [{ and: ['a', 'b', 'c', 'd'] }, 'e'] });
  options = Checker.checkOptions('a && b && c && d && e');
  expect(options).toMatchObject({ and: ['a', 'b', 'c', 'd', 'e'] });
});
