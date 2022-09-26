import { Extractor } from './extractor';

class Parser {
  public static splitLines(file: string): Array<string> {
    return file
      .replace(/(?:\r\n|\r|\n)/g, ' ')
      .replace('\\n', ' ')
      .replace('\n', ' ')
      .replace('\r\n', ' ')
      .replace(/[ \n]+/g, ' ')
      .split(/;+/)
      .filter((str) => str.includes('process.env') || str.includes('@env_var'))
      .filter((str) => {
        const strSplit = str.split('{')[0].replace(' ', '');
        // console.log('strSplit:', strSplit);
        return strSplit.match(
          /^(?:(?:(?:\/\*)+.*?(?:\*\/)+)*\s*((var)|(let)|(const))[\n ]+)/gm
        );
      });
  }

  public static getEnvironmentVariables(file: string): Array<string> {
    let env = [...file.matchAll(/process\.env\.([\w]+)/gm)]
      .map((match) => (match + '').replace('process.env.', '').split(','))
      .flat();
    env = [...new Set(env)];
    return env;
  }

  public static async getSpecialVariables(file: string) {
    const splittedLines = Parser.splitLines(file);
    // console.log('splittedLines:', splittedLines);
    const all = {};

    for (const line of splittedLines) {
      const variables = line
        .split(/[=]+/)[0]
        .split(/[:;,.\?\|\& ]+/)
        .filter((str) => str.trim() !== '');

      // console.log('variables:', variables);

      const type = variables.findIndex(
        (element) =>
          element.trim() === 'var' ||
          element.trim() === 'let' ||
          element.trim() === 'const'
      );

      const name =
        type !== -1
          ? variables[type + 1]
          : variables.length === 1
          ? variables[0]
          : variables.length >= 2
          ? variables[1]
          : variables[0];

      // console.log('name', name);

      let environmentVariables = [...line.matchAll(/process\.env\.([\w]+)/gm)]
        .map((match) => (match + '').replace('process.env.', '').split(','))
        .flat();
      environmentVariables = [...new Set(environmentVariables)];

      const defaultValuesStrArr = line.split('=');

      defaultValuesStrArr.splice(0, 1);
      const defaultValuesStr = defaultValuesStrArr.join('=');

      const defaultValues = await Extractor.extract(
        defaultValuesStr,
        undefined,
        undefined,
        undefined,
        file
      );

      const splitted = {
        name,
        environmentVariables,
        defaultValues,
      };
      // console.log('splitted', splitted);
      all[name] = splitted;
    }
    // console.log('all', all);

    return all;
  }
}

export { Parser };
