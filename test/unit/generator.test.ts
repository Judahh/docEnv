import { Generator } from '../../source/generator';
test('Test Simple File', async () => {
  const path = './test/sampleAPI';
  const gen = await Generator.generate(path);
  console.log(gen);
});
