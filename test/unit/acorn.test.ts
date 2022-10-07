/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import * as acorn from 'acorn';
// import acornTs from 'acorn-typescript';

// import * as tsFileParser from 'ts-file-parser';
import { TypescriptParser } from 'typescript-parser';
import { parse, createProgram } from '@typescript-eslint/parser';

import { readFile } from 'fs/promises';

test('Test Simple File', async () => {
  const path = './test/sample1.ts';
  const file = await readFile(path, 'utf8');
  let parsed: any;
  // parsed = acorn.parse(file, {
  //   // @ts-ignore
  //   trackComments: true,
  //   ecmaVersion: 2022,
  // });
  // console.log('ACORN', JSON.stringify(parsed, null, 5));
  // const parser = new TypescriptParser();
  // parsed = await parser.parseSource(file);
  // console.log('TypescriptParser', JSON.stringify(parsed, null, 5));
  parsed = createProgram('tsconfig.json');
  console.log('TypescriptParser', parsed.getSourceFiles()); //JSON.stringify(parsed, null, 5));
  // parsed = tsFileParser.parseStruct(file, {}, path);
  // console.log('TypescriptParser', JSON.stringify(parsed, null, 5));
});
