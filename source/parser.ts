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
        // console.log("strSplit:", strSplit);
        return strSplit.match(/^([\n ]*(var)|(let)|(const)[\n ]+)/gm);
      });
  }

  public static getEnvironmentVariables(file: string): Array<string> {
    let env = [...file.matchAll(/process\.env\.([\w]+)/gm)]
      .map((match) => (match + '').replace('process.env.', '').split(','))
      .flat();
    env = [...new Set(env)];
    return env;
  }

  public static getSpecialVariables(file: string) {
    const splittedLines = Parser.splitLines(file);
    const all = {};

    for (const line of splittedLines) {
      const variables = line
        .split(/[=]+/)[0]
        .split(/[:;,.\?\|\& ]+/)
        .filter((str) => str.trim() !== '');

      const name =
        variables.length === 1
          ? variables[0]
          : variables.length >= 2
          ? variables[1]
          : variables[0];

      // console.log("name", name);

      let environmentVariables = [...line.matchAll(/process\.env\.([\w]+)/gm)]
        .map((match) => (match + '').replace('process.env.', '').split(','))
        .flat();
      environmentVariables = [...new Set(environmentVariables)];

      // console.log('line', line);
      const defaultValuesStrArr = line.split('=');

      defaultValuesStrArr.splice(0, 1);
      const defaultValuesStr = defaultValuesStrArr.join('=');
      // console.log('defaultValuesStr', defaultValuesStr);

      const defaultValues = Extractor.extract(defaultValuesStr);

      // let defaultValuesStr = defaultValuesStrArr.join("=").replace(/process\.env\.([\w]+)\?*\.*[\w]+\(*\)* *[<>=]=* *'*"*`*[\w]+`*"*'*/gm, (a,e1)=>e1);
      // const format = defaultValuesStr
      //   .replace(
      //     /\.([^ \n\|\&=<>]+) *([<>=]=+) *([^ \n\|\&=<>]+)/g,
      //     (_a, e1) => `.${e1} `
      //   )
      //   .replace(/[ \n]+/g, " ");
      // const uniq = format.replace(
      //   / +([^ \n\|\&=<>]+) +\|+ +([^ \n\|\&=<>]+) +/g,
      //   (a, e1, e2) => {
      //     //   console.log("A: ", a);
      //     //   console.log("E1: ", e1);
      //     //   console.log("E2: ", e2);
      //     return e1 === e2 ? ` ${e1} ` : ` ${e1} || ${e2} `;
      //   }
      // );
      // const defaultValues = uniq
      //   .split(/[:;,.\?\|\& ]+/)
      //   .filter((defaults) => defaults !== "" && defaults !== "env");
      // const required = defaultValues.length === 0;

      const splitted = {
        name,
        environmentVariables,
        defaultValues,
      };
      all[name] = splitted;
    }

    return all;
  }
}

export { Parser };
