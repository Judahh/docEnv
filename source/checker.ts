class Checker {
  public static group(
    string: string,
    removeOuter?: boolean
  ): string | undefined {
    const brackets = '[]{}()<>';
    const stack: Array<number> = [];
    let start = -1;

    for (let index = 0; index < string.length; index++) {
      const bracket = string[index];
      const bracketsIndex = brackets.indexOf(bracket);

      if (bracketsIndex === -1) {
        continue;
      }

      if (bracketsIndex % 2 === 0) {
        if (start === -1) start = index;
        stack.push(bracketsIndex + 1);
      } else if (stack.pop() !== bracketsIndex) {
        return undefined;
      }
      if (stack.length === 0) {
        if (start === -1) start = 0;
        let newString = string.slice(0, index + 1);
        const match = newString.match(/[\[\]\{\}\(\)\<\>]/g);
        newString =
          removeOuter && match != undefined
            ? newString.slice(start + 1, index - 1)
            : newString;
        // console.log(newString);
        return newString;
      }
    }
    if (stack.length === 0) {
      if (start === -1) start = 0;
      const match = string.match(/[\[\]\{\}\(\)\<\>]/g);
      string =
        removeOuter && match != undefined
          ? string.slice(start + 1, string.length - 2)
          : string;
      // console.log(string);
      return string;
    }
    return undefined;
  }

  public static checkOptions(string?: string): any {
    const elements = '&|?:,;[]{}()<>';
    let min = Infinity;
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      if (string?.indexOf?.(element) !== -1) {
        if (min > index || min == Infinity) min = index;
      }
    }
    if (min == Infinity || string == undefined) return string;
    if (min > 5) return Checker.checkOptions(Checker.group(string, true));
    if (min < 2) return Checker.checkOption(string);
    return Checker.checkTernary(string);
  }

  public static checkOption(string: string, and?: boolean) {
    const brackets = '[]{}()<>';
    const option = and ? '&' : '|';
    let options: Array<string> = [];
    let begin = 0;
    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const optionIndex = option === element ? index : -1;
      const bracketsIndex = brackets.indexOf(element);

      if (bracketsIndex > -1) {
        // group and ignore
        const g = Checker.group(string.substring(index));
        // console.log('group:', g);
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
      formattedOptions = options.map((o) => Checker.checkOption(o, true));
    formattedOptions = formattedOptions.map((o: any) =>
      typeof o === 'string' ? Checker.checkOptions(o) : o
    );
    return and ? { and: formattedOptions } : { or: formattedOptions };
  }

  public static checkTernary(string: string): any {
    const elements = '?:,;';
    const brackets = '[]{}()<>';
    let lastIndex = -1;
    let endIf = -1;
    let endThen = -1;

    for (let index = 0; index < string.length; index++) {
      const element = string[index];
      const elementsIndex = elements.indexOf(element);
      const bracketsIndex = brackets.indexOf(element);

      if (bracketsIndex > -1) {
        // group and ignore
        const g = Checker.group(string.substring(index));
        // console.log('group:', g);
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

          .replace(/[,;]/, '')
          .trim();
        console.log('ifEl:', ifEl, typeof ifEl);
        console.log('thenEl:', thenEl, typeof thenEl);
        console.log('elseEl:', elseEl, typeof elseEl);

        return {
          if: typeof ifEl === 'string' ? Checker.checkOptions(ifEl) : ifEl,
          then:
            typeof thenEl === 'string' ? Checker.checkOptions(thenEl) : thenEl,
          else:
            typeof elseEl === 'string' ? Checker.checkOptions(elseEl) : elseEl,
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
    if (endThen > -1 && endIf > -1) {
      const ifEl = string.substring(0, endIf).trim();
      const thenEl = string.substring(endIf + 1, endThen).trim();
      const elseEl = string
        .substring(endThen + 1)
        .replace(/[,;]/, '')
        .trim();
      console.log('ifEl:', ifEl, typeof ifEl);
      console.log('thenEl:', thenEl, typeof thenEl);
      console.log('elseEl:', elseEl, typeof elseEl);
      return {
        if: typeof ifEl === 'string' ? Checker.checkOptions(ifEl) : ifEl,
        then:
          typeof thenEl === 'string' ? Checker.checkOptions(thenEl) : thenEl,
        else:
          typeof elseEl === 'string' ? Checker.checkOptions(elseEl) : elseEl,
      };
    } else return undefined;
  }
}

export { Checker };
