/* eslint-disable no-unused-vars */
class Extractor {
  public static and = '&';
  public static or = '|';
  public static options = Extractor.and + Extractor.or;

  public static ternaryThen = '?';
  public static ternaryElse = ':';
  public static ternary = Extractor.ternaryThen + Extractor.ternaryElse;
  public static terminator = ',;';
  public static terminatorRegex = RegExp(`[${Extractor.terminator}]`);
  public static fullTernary = Extractor.ternary + Extractor.terminator;

  public static bOpenBrackets = '[(<';
  public static bCloseBrackets = '])>';
  public static bBrackets = Extractor.bOpenBrackets + Extractor.bCloseBrackets;

  public static openBrackets = '{' + Extractor.bOpenBrackets;
  public static closeBrackets = '}' + Extractor.bCloseBrackets;
  public static brackets = Extractor.openBrackets + Extractor.closeBrackets;

  public static openObject = '{';
  public static closeObject = '}';
  public static object = Extractor.openObject + Extractor.closeObject;
  public static propertyEquals = ':=';
  public static propertyNext = ',;';

  public static getPosition(matches: Array<number>, index = 0) {
    return matches[index];
  }

  public static bundler(
    receivedString: string,
    cleanFunction: (
      string: string,
      start: number,
      end: number,
      removeOuter?: boolean
    ) => any,
    startTypes: string | string[],
    endTypes: string | string[],
    hideTypes?: string | string[],
    hideFunction?: (string: string) => string,
    removeOuter?: boolean,
    object = {}
  ): any {
    let string = '' + receivedString;
    const stack: Array<number> = [];
    const starts: Array<number> = [];
    const ends: Array<number> = [];
    const match: Array<string> = [];
    startTypes = [...startTypes];
    endTypes = [...endTypes];

    console.log('Bundler S:', string);

    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const startIndex = startTypes.indexOf(element);
      const endIndex = endTypes.indexOf(element);
      const hideIndex = hideTypes?.indexOf?.(element);

      if (
        hideIndex != undefined &&
        hideFunction != undefined &&
        hideIndex > -1
      ) {
        const pg = string.substring(index);
        const g = hideFunction(pg);
        index += (g?.length || 1) - 1;
        continue;
      }

      if (startIndex === -1 && endIndex === -1) continue;

      if (startIndex > -1) {
        stack.push(startIndex);
        starts.push(index);
        match.push(element);
      } else if (stack.pop() !== endIndex) {
        console.error('Bundler Error:', string, '-', stack);
        return undefined;
      } else {
        ends.push(index);
        match.push(element);
      }

      if (stack.length === 0 && (match?.length || 0) > 0) {
        console.log('Bundler:', string, '-', match, '-', starts, '-', ends);
        return Extractor.cleaner(
          string,
          cleanFunction,
          startTypes,
          endTypes,
          match,
          starts,
          ends,
          removeOuter,
          object
        );
      }
    }
    if (stack.length === 0) {
      // if (ends.length === 0) {
      //   ends.push(string.length);
      //   match.push(endTypes[0]);
      //   string += endTypes[0];
      // }
      console.log('Bundler:', string, '-', match, '-', starts, '-', ends);
      return Extractor.cleaner(
        string,
        cleanFunction,
        startTypes,
        endTypes,
        match,
        starts,
        ends,
        removeOuter,
        object
      );
    }
    ends.push(string.length);
    match.push(endTypes[0]);
    string += endTypes[0];
    console.log('Bundler L:', string, '-', match, '-', starts, '-', ends);
    return Extractor.cleaner(
      string,
      cleanFunction,
      startTypes,
      endTypes,
      match,
      starts,
      ends,
      removeOuter,
      object
    );
  }

  public static cleaner(
    string: string,
    cleanFunction: (
      string: string,
      start: number,
      end: number,
      removeOuter?: boolean,
      object?: any
    ) => any,
    startTypes: string | string[],
    endTypes: string | string[],
    match: Array<string> = [],
    starts: Array<number> = [],
    ends: Array<number> = [],
    removeOuter?: boolean,
    object = {}
  ) {
    if (
      starts != undefined &&
      ends != undefined &&
      starts.length > 0 &&
      ends.length > 0
    ) {
      const start = match[0];
      const startIndex = Extractor.getPosition(starts);
      const typeIndex = startTypes.indexOf(start);
      const end = endTypes[typeIndex];

      let num = 0;
      for (let index = 0; index < match.length; index++) {
        const element = match[index];
        if (element === start) num++;
        else if (element === end) num--;
        if (num === 0) {
          const startSize =
            match?.filter((s) => startTypes.includes(s)).length || 0;
          const pIndex = index - startSize;

          const endIndex = Extractor.getPosition(ends, pIndex);
          return cleanFunction(
            string,
            startIndex,
            endIndex,
            removeOuter,
            object
          );
        }
      }
    }
    return string;
  }

  public static cleanBundle(
    string: string,
    start: number,
    end: number,
    removeOuter?: boolean
  ) {
    string = string
      .trim()
      .slice(start + (removeOuter ? 1 : 0), end + 1 - (removeOuter ? 1 : 0));
    return string;
  }

  public static cleanObject(
    string: string,
    start: number,
    end: number,
    object = {}
  ) {
    const objectString = string.substring(start + 1, end).trim();
    const openBrackets = Extractor.openBrackets + Extractor.openObject;
    const closeBrackets = Extractor.closeBrackets + Extractor.closeObject;

    const hideFunction = (string) =>
      Extractor.bundler(
        string,
        Extractor.cleanBundle,
        openBrackets,
        closeBrackets
      );

    console.log('cleanObject init', objectString, objectString.length);

    let index = 0;
    while (index < objectString.length) {
      const currentString = objectString.substring(index).trim();
      console.log('cleanObject start', currentString, currentString.length);
      const bundled = Extractor.bundler(
        currentString,
        Extractor.cleanBundle,
        Extractor.propertyEquals,
        Extractor.propertyNext,
        Extractor.openBrackets + Extractor.closeBrackets,
        hideFunction
      ).trim();
      console.log('cleanObject bundled', bundled);
      const position = objectString.indexOf(bundled, index);
      console.log('cleanObject position', position);
      const name = objectString.substring(index, position).trim();
      const toRemove = RegExp(
        `[${Extractor.propertyEquals + Extractor.propertyNext}]`,
        'g'
      );
      const value = bundled?.replace(toRemove, '')?.trim();
      object[name] = value;

      console.log(
        'cleanObject index',
        index,
        '-',
        position,
        '-',
        name,
        '-',
        value,
        '-',
        bundled
      );
      const lastIndex = index;
      index = position + bundled.length;
      if (index === lastIndex) break;
      console.log(
        'cleanObject index',
        index,
        '-',
        objectString,
        '-',
        objectString.length,
        '-',
        object
      );
    }
    console.log('cleanObject', object);
    return object;
  }

  public static cleanTernary(
    string: string,
    start: number,
    end: number //,
    // removeOuter?: boolean
  ) {
    const ifEl = string.substring(0, start).trim();
    const thenEl = string.substring(start + 1, end).trim();
    const elseEl = string
      .substring(end + 1)

      .replace(Extractor.terminatorRegex, '')
      .trim();
    // console.log('ifEl:', ifEl, typeof ifEl);
    // console.log('thenEl:', thenEl, typeof thenEl);
    // console.log('elseEl:', elseEl, typeof elseEl);

    return {
      if: typeof ifEl === 'string' ? Extractor.extract(ifEl) : ifEl,
      then: typeof thenEl === 'string' ? Extractor.extract(thenEl) : thenEl,
      else: typeof elseEl === 'string' ? Extractor.extract(elseEl) : elseEl,
    };
  }

  public static extract(receivedString?: string): any {
    let string = '' + receivedString;
    const elements = Extractor.options + Extractor.ternary + Extractor.object;
    string = string?.trim();

    if (string == undefined) return string;

    const tempBundle = Extractor.bundler(
      string,
      Extractor.cleanBundle,
      Extractor.bOpenBrackets,
      Extractor.bCloseBrackets
    );

    const isBundle = tempBundle == string;

    string = isBundle
      ? Extractor.bundler(
          string,
          Extractor.cleanBundle,
          Extractor.bOpenBrackets,
          Extractor.bCloseBrackets,
          undefined,
          undefined,
          true
        )
      : string;

    let min = Infinity;
    let minElementIndex;
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      const newI = string.indexOf(element);
      if (newI != -1 && (min > newI || min == Infinity)) {
        min = newI;
        minElementIndex = index;
      }
    }

    console.log('min', minElementIndex, '-', min, '-', string, '-', elements);

    if (minElementIndex == undefined) {
      const bundle = Extractor.bundler(
        string,
        Extractor.cleanBundle,
        Extractor.openBrackets,
        Extractor.closeBrackets,
        undefined,
        undefined,
        true
      );
      return bundle;
    }

    if (minElementIndex < 2) return Extractor.extractOption(string); // '|' or '&'

    if (minElementIndex < 4)
      return Extractor.bundler(
        string,
        Extractor.cleanTernary,
        Extractor.ternaryThen,
        Extractor.ternaryElse,
        Extractor.openBrackets + Extractor.closeBrackets,
        (string) =>
          Extractor.bundler(
            string,
            Extractor.cleanBundle,
            Extractor.openBrackets,
            Extractor.closeBrackets
          )
      ); // '?' or ':'

    console.log('extract', string);

    return Extractor.bundler(
      string,
      Extractor.cleanObject,
      Extractor.openObject,
      Extractor.closeObject,
      Extractor.bBrackets,
      (string) =>
        Extractor.bundler(
          string,
          Extractor.cleanBundle,
          Extractor.bOpenBrackets,
          Extractor.bCloseBrackets
        )
    );
  }

  public static extractOption(receivedString: string, and?: boolean) {
    const string = '' + receivedString;
    const option = and ? Extractor.and : Extractor.or;
    let options: Array<string> = [];
    let begin = 0;
    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const optionIndex = option === element ? index : -1;
      const openBracketsIndex = Extractor.openBrackets.indexOf(element);

      if (openBracketsIndex > -1) {
        const pg = string.substring(index);
        const g = Extractor.bundler(
          pg,
          Extractor.cleanBundle,
          Extractor.openBrackets,
          Extractor.closeBrackets
        );
        index += (g?.length || 1) - 1;
        continue;
      }

      if (optionIndex === -1) {
        continue;
      } else {
        options.push(string.substring(begin, index));
        begin = index;
      }
    }
    options.push(string.substring(begin, string.length));
    options = options
      .map((o) => o.replaceAll(option, '').trim())
      .filter((o) => o.length > 0);
    let formattedOptions: any = options;
    if (!and && string.includes('&'))
      formattedOptions = options.map((o) => Extractor.extractOption(o, true));
    formattedOptions = formattedOptions.map((o: any) =>
      typeof o === 'string' ? Extractor.extract(o) : o
    );
    if (formattedOptions.length == 1) return formattedOptions[0];
    return and ? { and: formattedOptions } : { or: formattedOptions };
  }
}

export { Extractor };
