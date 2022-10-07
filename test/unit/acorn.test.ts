import * as acorn from 'acorn';
import { readFile } from 'fs/promises';

test('Test Simple File', async () => {
  const file = await readFile('./test/sample1.ts', 'utf8');
  console.log(
    JSON.stringify(acorn.parse(file, { trackComments: true }), null, 5)
  );
});
