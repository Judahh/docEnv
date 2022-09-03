class Extractor {
  public static and = '&';
  public static or = '|';
  public static options = Extractor.and + Extractor.or;
  public static ternary = '?:';
  public static terminator = ',;';
  public static terminatorRegex = /[,;]/;
  public static fullTernary = Extractor.ternary + Extractor.terminator;
  public static openBrackets = '[{(<';
  public static closeBrackets = ']})>';
  public static brackets = Extractor.openBrackets + Extractor.closeBrackets;
  public static bracketsRegex = /[\[\]\{\}\(\)\<\>]/g;

  public static getPosition(
    receivedString: string,
    subString: string,
    index = 0
  ) {
    const string = '' + receivedString;
    return string.split(subString, index).join(subString).length;
  }

  public static cleanBundle(receivedString: string, removeOuter?: boolean) {
    let string = '' + receivedString;
    const match = string.match(Extractor.bracketsRegex);
    console.log('clean bundler 0:', string, match, removeOuter);
    if (match != undefined) {
      const first = string.indexOf(match[0]);
      const openBracketsIndex = Extractor.openBrackets.indexOf(match[0]);
      const openBracket = Extractor.openBrackets[openBracketsIndex];
      const closeBracket = Extractor.closeBrackets[openBracketsIndex];

      let num = 1;
      for (let index = 1; index < match.length; index++) {
        const element = match[index];
        if (element === openBracket) num++;
        else if (element === closeBracket) num--;
        if (num === 0) {
          console.log('clean bundler pre-end:', string, match, removeOuter);
          const end = Extractor.getPosition(string, element, index);
          console.log('clean bundler end:', string, end, first);
          string = string.slice(
            first + (removeOuter ? 1 : 0),
            end + 1 - (removeOuter ? 1 : 0)
          );
          console.log('clean bundler 1:', string, match, removeOuter);
          return string;
        }
      }
    }
    console.log('clean bundler:', string, match, removeOuter);
    return string;
  }

  public static bundler(
    receivedString: string,
    removeOuter?: boolean
  ): string | undefined {
    const string = '' + receivedString;
    const stack: Array<number> = [];

    for (let index = 0; index < string.length; index++) {
      const bracket = string[index];
      const openBracketsIndex = Extractor.openBrackets.indexOf(bracket);
      const closeBracketsIndex = Extractor.closeBrackets.indexOf(bracket);

      if (openBracketsIndex === -1 && closeBracketsIndex === -1) continue;

      if (openBracketsIndex > -1) stack.push(openBracketsIndex);
      else if (stack.pop() !== closeBracketsIndex) {
        console.error('Bundler Error:', string, stack);
        return undefined;
      }
      if (stack.length === 0) {
        return Extractor.cleanBundle(string, removeOuter);
      }
    }
    if (stack.length === 0) {
      return Extractor.cleanBundle(string, removeOuter);
    }
    console.error('Bundler Error:', string, stack);
    return undefined;
  }

  public static extract(receivedString?: string): any {
    let string = '' + receivedString;
    const elements = Extractor.options + Extractor.ternary;
    let min = Infinity;
    string = string?.split(',')[0].trim().split(';')[0].trim();

    if (string == undefined) return string;

    console.log('extract b:', string);

    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      if (string?.indexOf?.(element) !== -1) {
        if (min > index || min == Infinity) min = index;
      }
    }

    console.log('extract c:', string, min);

    if (min == Infinity) {
      const bundle = Extractor.bundler(string, true);
      console.log('extract d:', bundle);
      return bundle;
    }

    if (min < 2) return Extractor.extractOption(string); // '|' or '&'

    return Extractor.extractTernary(string); // '?' or ':'
  }

  public static extractOption(receivedString: string, and?: boolean) {
    const string = '' + receivedString;
    const option = and ? Extractor.and : Extractor.or;
    let options: Array<string> = [];
    let begin = 0;
    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const optionIndex = option === element ? index : -1;
      const bracketsIndex = Extractor.brackets.indexOf(element);

      if (bracketsIndex > -1) {
        // bundler and ignore
        const g = Extractor.bundler(string.substring(index));
        // console.log('bundler:', g);
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
    console.log('extractOption a:', string, options, formattedOptions);
    formattedOptions = formattedOptions.map((o: any) =>
      typeof o === 'string' ? Extractor.extract(o) : o
    );
    console.log('extractOption b:', formattedOptions);
    return and ? { and: formattedOptions } : { or: formattedOptions };
  }

  public static extractTernary(receivedString: string): any {
    const string = '' + receivedString;
    let lastIndex = -1;
    let endIf = -1;
    let endThen = -1;

    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const elementsIndex = Extractor.fullTernary.indexOf(element);
      const openBracketsIndex = Extractor.openBrackets.indexOf(element);

      if (openBracketsIndex > -1) {
        const pg = string.substring(index);
        console.log('extractTernary bundler pg:', pg);
        const g = Extractor.bundler(pg);
        console.log('extractTernary bundler g:', g);
        index += (g?.length || 1) - 1;
        continue;
      }

      if (elementsIndex === -1) {
        continue;
      }

      if (elementsIndex > 1) {
        const ifEl = string.substring(0, endIf).trim();
        const thenEl = string.substring(endIf + 1, endThen).trim();
        const elseEl = string
          .substring(endThen + 1)

          .replace(Extractor.terminatorRegex, '')
          .trim();
        console.log('ifEl:', ifEl, typeof ifEl);
        console.log('thenEl:', thenEl, typeof thenEl);
        console.log('elseEl:', elseEl, typeof elseEl);

        return {
          if: typeof ifEl === 'string' ? Extractor.extract(ifEl) : ifEl,
          then: typeof thenEl === 'string' ? Extractor.extract(thenEl) : thenEl,
          else: typeof elseEl === 'string' ? Extractor.extract(elseEl) : elseEl,
        };
      } else if (elementsIndex > lastIndex) {
        if (lastIndex === -1) {
          endIf = index;
        }
        if (lastIndex === 0) {
          endThen = index;
        }
        lastIndex = elementsIndex;
      }
    }
    console.log('extractTernary end:', string, endIf, endThen);
    if (endThen > -1 && endIf > -1) {
      const ifEl = string.substring(0, endIf).trim();
      const thenEl = string.substring(endIf + 1, endThen).trim();
      const elseEl = string
        .substring(endThen + 1)
        .replace(Extractor.terminatorRegex, '')
        .trim();
      console.log('ifEl:', ifEl, typeof ifEl);
      console.log('thenEl:', thenEl, typeof thenEl);
      console.log('elseEl:', elseEl, typeof elseEl);
      return {
        if: typeof ifEl === 'string' ? Extractor.extract(ifEl) : ifEl,
        then: typeof thenEl === 'string' ? Extractor.extract(thenEl) : thenEl,
        else: typeof elseEl === 'string' ? Extractor.extract(elseEl) : elseEl,
      };
    } else return Extractor.extract(Extractor.bundler(string, true));
  }
}

export { Extractor };
