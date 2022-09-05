/* eslint-disable no-unused-vars */
class Extractor {
  public static and = '&';
  public static or = '|';
  public static options = Extractor.and + Extractor.or;
  public static ternaryThen = '?';
  public static ternaryElse = ':';
  public static ternary = Extractor.ternaryThen + Extractor.ternaryElse;
  public static terminator = ',;';
  public static terminatorRegex = /[,;]/;
  public static fullTernary = Extractor.ternary + Extractor.terminator;
  public static openBrackets = '[{(<';
  public static closeBrackets = ']})>';
  public static brackets = Extractor.openBrackets + Extractor.closeBrackets;
  public static bracketsRegex = /[\[\]\{\}\(\)\<\>]/g;

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
    removeOuter?: boolean
  ): any {
    const string = '' + receivedString;
    const stack: Array<number> = [];
    const starts: Array<number> = [];
    const ends: Array<number> = [];
    const match: Array<string> = [];
    // if (hideTypes)
    //   console.log(
    //     'bundler hideTypes:',
    //     hideTypes,
    //     '-',
    //     startTypes,
    //     '-',
    //     endTypes
    //   );

    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const startIndex = startTypes.indexOf(element);
      const endIndex = endTypes.indexOf(element);
      const hideIndex = hideTypes?.indexOf?.(element);
      // if (hideTypes)
      //   console.log(
      //     'element:',
      //     element,
      //     '-',
      //     index,
      //     '-',
      //     hideIndex,
      //     '-',
      //     hideFunction,
      //     '-',
      //     hideTypes,
      //     '-',
      //     string
      //   );

      if (
        hideIndex != undefined &&
        hideFunction != undefined &&
        hideIndex > -1
      ) {
        const pg = string.substring(index);
        // console.log(
        //   'hide bundler pg:',
        //   pg,
        //   '-',
        //   string,
        //   '-',
        //   index,
        //   '-',
        //   string.length
        // );
        const g = hideFunction(pg);
        // console.log(
        //   'hide bundler g:',
        //   g,
        //   '-',
        //   string,
        //   '-',
        //   index,
        //   '-',
        //   g?.length
        // );
        index += (g?.length || 1) - 1;
        continue;
      }

      if (startIndex === -1 && endIndex === -1) continue;

      if (startIndex > -1) {
        stack.push(startIndex);
        starts.push(index);
        match.push(element);
      } else if (stack.pop() !== endIndex) {
        console.error('Bundler Error:', string, stack);
        return undefined;
      } else {
        ends.push(index);
        match.push(element);
      }

      if (stack.length === 0)
        return Extractor.cleaner(
          string,
          cleanFunction,
          startTypes,
          endTypes,
          match,
          starts,
          ends,
          removeOuter
        );
    }
    if (stack.length === 0)
      return Extractor.cleaner(
        string,
        cleanFunction,
        startTypes,
        endTypes,
        match,
        starts,
        ends,
        removeOuter
      );
    console.error('Bundler Error:', string, stack);
    return undefined;
  }

  public static cleaner(
    string: string,
    cleanFunction: (
      string: string,
      start: number,
      end: number,
      removeOuter?: boolean
    ) => any,
    startTypes: string | string[],
    endTypes: string | string[],
    match: Array<string> = [],
    starts: Array<number> = [],
    ends: Array<number> = [],
    removeOuter?: boolean
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

      // console.log(
      //   'cleaner:',
      //   string, // a ? (b ? c : d) : e
      //   '-',
      //   start, // ?
      //   '-',
      //   end, // :
      //   '-',
      //   startIndex, // 2
      //   '-',
      //   typeIndex, // 0
      //   '-',
      //   match,
      //   '-',
      //   startTypes, // ?
      //   '-',
      //   endTypes, // :
      //   '-',
      //   starts, // 2 -> ? ok
      //   '-',
      //   ends // 16 -> : ok
      // );

      let num = 1;
      for (let index = 1; index < match.length; index++) {
        const element = match[index];
        if (element === start) num++;
        else if (element === end) num--;
        if (num === 0) {
          const endIndex = Extractor.getPosition(ends, index - 1);
          // console.log(
          //   'cleaner end:',
          //   string, // a ? (b ? c : d) : e
          //   '-',
          //   startIndex, // ?
          //   '-',
          //   endIndex, // :
          //   '-',
          //   removeOuter
          // );

          return cleanFunction(string, startIndex, endIndex, removeOuter);
        }
      }
    }
    // console.log('clean bundler:', string, match, removeOuter);
    return string;
  }

  public static cleanBundle(
    string: string,
    start: number,
    end: number,
    removeOuter?: boolean
  ) {
    // console.log('cleanBundle:', string, '-', start, '-', end, '-', removeOuter);
    string = string
      .trim()
      .slice(start + (removeOuter ? 1 : 0), end + 1 - (removeOuter ? 1 : 0));
    // console.log('cleanBundle 1:', string, '-', start, '-', end);
    return string;
  }

  public static cleanTernary(
    string: string,
    start: number,
    end: number //,
    // removeOuter?: boolean
  ) {
    // console.log('cleanTernary:', string, '-', start, '-', end);
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
    const elements = Extractor.options + Extractor.ternary;
    let min = Infinity;
    string = string?.split(',')[0].trim().split(';')[0].trim();

    if (string == undefined) return string;

    // console.log('extract a:', string);

    const tempBundle = Extractor.bundler(
      string,
      Extractor.cleanBundle,
      Extractor.openBrackets,
      Extractor.closeBrackets
    );

    // console.log('extract tempBundle:', tempBundle, string);

    const isBundle = tempBundle == string;

    string = isBundle
      ? Extractor.bundler(
          string,
          Extractor.cleanBundle,
          Extractor.openBrackets,
          Extractor.closeBrackets,
          undefined,
          undefined,
          true
        )
      : string;

    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      if (string?.indexOf?.(element) !== -1) {
        if (min > index || min == Infinity) min = index;
      }
    }

    // console.log('extract b:', string, min);

    if (min == Infinity) {
      const bundle = Extractor.bundler(
        string,
        Extractor.cleanBundle,
        Extractor.openBrackets,
        Extractor.closeBrackets,
        undefined,
        undefined,
        true
      );
      // console.log('extract c:', bundle);
      return bundle;
    }

    if (min < 2) return Extractor.extractOption(string); // '|' or '&'

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
        // console.log('extractOption bundler pg:', pg);
        const g = Extractor.bundler(
          pg,
          Extractor.cleanBundle,
          Extractor.openBrackets,
          Extractor.closeBrackets
        );
        console.log('extractOption bundler g:', g);
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
    // console.log('extractOption a:', string, options, formattedOptions);
    formattedOptions = formattedOptions.map((o: any) =>
      typeof o === 'string' ? Extractor.extract(o) : o
    );
    // console.log('extractOption b:', formattedOptions);
    if (formattedOptions.length == 1) return formattedOptions[0];
    return and ? { and: formattedOptions } : { or: formattedOptions };
  }
}

export { Extractor };
