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

// test('Test Ternary Large', async () => {
//   let ternary = Checker.checkOptions('a ? b? c: d : e');
//   expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
//   ternary = Checker.checkOptions('a ? b : c ? d : e;');
//   expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
// });

// test('Test Ternary Large with groups', async () => {
//   let ternary = Checker.checkOptions('a ? (b?c:d) : e;');
//   expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
//   ternary = Checker.checkOptions('a ? b : (c ? d : e);');
//   expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
//   ternary = Checker.checkOptions('(a ? b : c) ? d : e;');
//   expect(ternary).toMatchObject({ if: 'a', then: 'b', else: 'c' });
// });

test('Test Options Basic', async () => {
  let options = Checker.checkOptions('a || b || c || d && e');
  expect(options).toMatchObject({ or: ['a', 'b', 'c', { and: ['d', 'e'] }] });
  options = Checker.checkOptions('a || b || c || d || e');
  expect(options).toMatchObject({ or: ['a', 'b', 'c', 'd', 'e'] });
  options = Checker.checkOptions('a && b && c && d || e');
  expect(options).toMatchObject({ or: [{ and: ['a', 'b', 'c', 'd'] }, 'e'] });
  options = Checker.checkOptions('a && b && c && d && e');
  expect(options).toMatchObject({ or: [{ and: ['a', 'b', 'c', 'd', 'e'] }] });
});
