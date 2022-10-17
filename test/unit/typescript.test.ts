/* eslint-disable prefer-const */
import { Doc } from '../../source/doc';

test('Test Simple File', async () => {
  // const path = './test/sample0.ts';
  let parsed: any;
  // const config = ts.config;
  // console.log(config);
  const doc = new Doc();
  parsed = await doc.generateDocumentation({
    filenames: [
      // './test/sampleAPI/services/aService.ts',
      // './test/sampleAPI/models/cFilter.ts',
      // './test/sample0.ts',
      './test/sample1.ts',
      // './test/sample2.ts',
      // './test/sample3.ts',
    ],
  });
  console.log(
    'TypescriptParser',
    // parsed
    JSON.stringify(parsed, null, 5)
  );
});
