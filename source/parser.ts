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

  public static addRelated(
    related: { [string: string]: any },
    name: string,
    values?: any,
    relatedBlocks?: any
  ) {
    if (related[name] == undefined) related[name] = { values, relatedBlocks };
    else {
      if (values != undefined) {
        if (related[name].values == undefined) related[name].values = values;
        else related[name].values = [...related[name].values, ...values];
      }
      if (relatedBlocks != undefined) {
        if (related[name].relatedBlocks == undefined)
          related[name].relatedBlocks = relatedBlocks;
        else {
          related[name].relatedBlocks = [
            related[name].relatedBlocks,
            relatedBlocks,
          ];
          related[name].relatedBlocks = [
            ...new Set(related[name].relatedBlocks),
          ];
        }
      }
    }
  }

  public static getRelated(
    defaultValues:
      | { [string: string]: any }
      | any[]
      | string
      | number
      | boolean,
    related?: { [string: string]: any },
    parent?: any,
    parentKey?: string | number
  ) {
    if (related == undefined) related = {};
    switch (typeof defaultValues) {
      case 'number':
      case 'boolean':
      case 'string':
        break;

      default:
        if (Array.isArray(defaultValues)) {
          for (let index = 0; index < defaultValues.length; index++) {
            const value = defaultValues[index];
            if (typeof value === 'object') {
              Parser.getRelated(value, related, defaultValues, index);
            }
          }
        } else {
          for (const key in defaultValues) {
            if (Object.prototype.hasOwnProperty.call(defaultValues, key)) {
              const defaultValue = defaultValues[key];
              if (
                key === 'relatedBlocks' &&
                parent != undefined &&
                parentKey != undefined
              ) {
                const values = Array.isArray(defaultValues.value)
                  ? defaultValues.value
                  : [defaultValues.value];
                const name = defaultValues.name || values[0];
                const relatedBlocks = defaultValues.relatedBlocks;
                parent[parentKey] = values[0];
                related[name] = { values, relatedBlocks };
              } else if (defaultValue.relatedBlocks) {
                const values = Array.isArray(defaultValue.value)
                  ? defaultValue.value
                  : [defaultValue.value];
                const name = defaultValue.name || values[0];
                const relatedBlocks = defaultValue.relatedBlocks;
                defaultValues[key] = values[0];
                related[name] = { values, relatedBlocks };
              } else if (defaultValue.defaultValues) {
                Parser.getRelated(
                  defaultValue.defaultValues,
                  related,
                  defaultValue,
                  'defaultValues'
                );
              } else
                Parser.getRelated(defaultValue, related, defaultValues, key);
            }
          }
        }
        break;
    }
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

      const parentDefaultValues = [
        await Extractor.extract(
          defaultValuesStr,
          undefined,
          undefined,
          undefined,
          name,
          file
        ),
      ];

      const related = {};

      Parser.getRelated(
        parentDefaultValues[0],
        related,
        parentDefaultValues,
        0
      );

      const splitted = {
        name,
        environmentVariables,
        defaultValues: parentDefaultValues[0],
        related,
      };
      // console.log('splitted', splitted);
      all[name] = splitted;
    }
    // console.log('all', all);

    return all;
  }
}

export { Parser };
