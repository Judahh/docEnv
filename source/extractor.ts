/* eslint-disable no-unused-vars */
enum Precedence {
  ternary, // a ? b : c -> hide each element then extract one by one again -> /(?:\?|\:)+(?![^\{\[\(\<]*[\}\]\)\>])/gm
  assignment, // a =/: b -> hide each element then extract one by one again -> /(?<![\:\=])(?:\:|\=){1}(?![\:\=])(?![^\{\[\(\<]*[\}\]\)\>])/gm OR /(?:[^\:|\=]+?)(\:|\=)(?:[^\:|\=]+?)(?![^\{\[\(\<]*[\}\]\)\>])/gm
  or, // a ||/| b -> hide each element then extract one by one again -> /(\||\|\|)+(?![^\{\[\(\<]*[\}\]\)\>])/gm
  and, // a &&/& b -> hide each element then extract one by one again -> /(\&|\&\&)+(?![^\{\[\(\<]*[\}\]\)\>])/gm
  comparation, // a [><=]=(=) b -> hide each element then extract one by one again -> /[\!\>\<\:\=]+(?:[\:\=]){1}(?![^\{\[\(\<]*[\}\]\)\>])/gm
  object, // /{a/} -> hide each element then extract one by one again -> /(?:\{|\})+(?![^\[\(\<]*[\]\)\>])/gm OR ^(\{)([\{\[\(\<]*.+[\}\]\)\>]*)*(\})$
  group, // /[/(/<a/>/)/] -> evaluate the inner element -> /(?:\(|\[|\]|\))+/gm
}

enum ExistingElement {
  before, // a (OPENING)
  inside, // (OPENING) a (CLOSING)
  after, // (CLOSING) a
}

class Extractor {
  public static char = '\\';
  public static terminator = ',;';

  public static and = ['&', '&&'];
  public static or = ['|', '||'];
  public static options = [...Extractor.and, ...Extractor.or];

  public static then = '?';
  public static else = ':';
  public static ternary = Extractor.then + Extractor.else;
  public static fullTernary = Extractor.ternary + Extractor.terminator;

  public static bOpenBrackets = '[(<';
  public static bCloseBrackets = '])>';
  public static bBrackets = [
    ...Extractor.bOpenBrackets,
    ...Extractor.bCloseBrackets,
  ];

  public static openBrackets = '{' + Extractor.bOpenBrackets;
  public static closeBrackets = '}' + Extractor.bCloseBrackets;
  public static brackets = [
    ...Extractor.openBrackets,
    ...Extractor.closeBrackets,
  ];

  public static openObject = '{';
  public static closeObject = '}';
  public static object = Extractor.openObject + Extractor.closeObject;

  public static simpleEquals = '=';
  public static equals = ':' + Extractor.simpleEquals;

  public static comparation = '!=><';

  public static getCleanFunction(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return Extractor.cleanTernary;
      case Precedence.assignment:
        return Extractor.cleanBundle;
      case Precedence.or:
        return Extractor.cleanOption;
      case Precedence.and:
        return Extractor.cleanOption;
      case Precedence.comparation:
        return Extractor.cleanBundle;
      case Precedence.object:
        return Extractor.cleanObject;
      default:
        return Extractor.cleanBundle;
    }
  }

  public static regex(precedence: Precedence) {
    const regex = Extractor.groupSimpleRegex(
      Extractor.simpleRegex(Extractor.getOpen(precedence))
    );
    const hideOpen = Extractor.groupSimpleRegex(
      Extractor.simpleRegex(Extractor.getToHideOC(precedence))
    );
    const hideClose = Extractor.groupSimpleRegex(
      Extractor.simpleRegex(Extractor.getToHideOC(precedence, true))
    );
    console.log('precedence:', precedence);
    console.log('regex:', regex);
    console.log('hideOpen:', hideOpen);
    console.log('hideClose:', hideClose);
    return new RegExp(`${regex}+(?![^${hideOpen}]*[${hideClose}])`, 'gm');
  }

  public static simpleRegex(string: string[] | string) {
    if (Array.isArray(string) && string.length >= 2) {
      if (string[0] == string[1] + string[1])
        return Extractor.char + string[1] + '+';
      else if (string[1] == string[0] + string[0])
        return Extractor.char + string[0] + '+';
    }
    return [...string].map((s) => Extractor.char + s).join('|');
  }

  public static groupSimpleRegex(string: string) {
    return '(?:' + string + ')';
  }

  public static getPosistions(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return [
          ExistingElement.before,
          ExistingElement.inside,
          ExistingElement.after,
        ];
      case Precedence.assignment:
        return [ExistingElement.before, ExistingElement.inside];
      case Precedence.or:
        return [ExistingElement.before, ExistingElement.inside];
      case Precedence.and:
        return [ExistingElement.before, ExistingElement.inside];
      case Precedence.comparation:
        return [ExistingElement.before, ExistingElement.inside];
      default:
        return [ExistingElement.inside];
    }
  }

  public static getToHideOC(precedence: Precedence, close?: boolean) {
    const toHide: string[] = [];
    let hide = precedence + 1;
    // console.log('hide:', hide);
    while (hide <= Precedence.group) {
      toHide.push(
        ...(close ? Extractor.getClose(hide) : Extractor.getOpen(hide))
      );
      hide++;
    }
    // console.log('hide done:', toHide);
    return toHide;
  }

  public static getToHide(precedence: Precedence) {
    const toHide: string[] = [];
    switch (precedence) {
      case Precedence.ternary:
        toHide.push(...Extractor.simpleEquals);
      case Precedence.assignment:
        toHide.push(...Extractor.or);
      case Precedence.or:
        toHide.push(...Extractor.and);
      case Precedence.and:
        toHide.push(...Extractor.comparation);
      case Precedence.comparation:
        toHide.push(...[...Extractor.openObject, ...Extractor.closeObject]);
      case Precedence.object:
        toHide.push(
          ...[...Extractor.bOpenBrackets, ...Extractor.bCloseBrackets]
        );
      default:
        return toHide;
    }
  }

  public static getSimpleElements(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return [...Extractor.then, ...Extractor.else];
      case Precedence.assignment:
        return [...Extractor.equals];
      case Precedence.or:
        return [...Extractor.or];
      case Precedence.and:
        return [...Extractor.and];
      case Precedence.comparation:
        return [...Extractor.comparation];
      case Precedence.object:
        return [...Extractor.object];
      default:
        return [...Extractor.bBrackets];
    }
  }

  public static getElements(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return [...Extractor.then, ...Extractor.else, ...Extractor.terminator];
      case Precedence.assignment:
        return [...Extractor.equals, ...Extractor.terminator];
      case Precedence.or:
        return [...Extractor.or, ...Extractor.terminator];
      case Precedence.and:
        return [...Extractor.and, ...Extractor.terminator];
      case Precedence.comparation:
        return [...Extractor.comparation, ...Extractor.terminator];
      case Precedence.object:
        return [...Extractor.object, ...Extractor.terminator];
      default:
        return [...Extractor.bBrackets, ...Extractor.terminator];
    }
  }

  public static getOpen(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return [...Extractor.then];
      case Precedence.assignment:
        return [...Extractor.equals];
      case Precedence.or:
        return [...Extractor.or];
      case Precedence.and:
        return [...Extractor.and];
      case Precedence.comparation:
        return [...Extractor.comparation];
      case Precedence.object:
        return [...Extractor.openObject];
      default:
        return [...Extractor.bOpenBrackets];
    }
  }

  public static getClose(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return [...Extractor.else];
      case Precedence.assignment:
        return [];
      case Precedence.or:
        return [];
      case Precedence.and:
        return [];
      case Precedence.comparation:
        return [];
      case Precedence.object:
        return [...Extractor.closeObject];
      default:
        return [...Extractor.bCloseBrackets];
    }
  }

  public static getPosition(matches: Array<number>, index = 0) {
    return matches[index];
  }

  public static getValue(value: string) {
    // console.log('Value:', value);
    if (value == undefined) return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      // console.log('Value Error:', value);
      return value;
    }
  }

  public static cleanBundle(
    options: {
      string: string;
      start: number;
      end: number;
    },
    removeOuter?: boolean
  ) {
    // console.log('CleanBundle:', string);
    options.string = options.string
      .trim()
      .slice(
        options.start + (removeOuter ? 1 : 0),
        options.end + 1 - (removeOuter ? 1 : 0)
      );
    return Extractor.getValue(options.string);
  }

  public static cleanObject(
    options: {
      string: string;
      start: number;
      end: number;
      object;
    },
    removeOuter?: boolean,
    precedence = Precedence.object
  ) {
    // console.log('Clean Object:', string, start, end);
    const objectString = options.string
      .substring(options.start + 1, options.end)
      .trim();
    const toRemove = Extractor.regex(precedence);

    // console.log('cleanObject init', objectString, objectString.length);

    let index = 0;
    while (index < objectString.length) {
      const currentString = objectString.substring(index).trim();
      // console.log('cleanObject start', currentString, currentString.length);
      const bundledElement = Extractor.bundler(
        currentString,
        Precedence.object
      );
      const bundled =
        typeof bundledElement === 'string'
          ? bundledElement.trim()
          : bundledElement;
      // console.log('cleanObject bundled', bundled);
      const position = objectString.indexOf(bundled, index);
      // console.log('cleanObject position', position);
      const name = objectString.substring(index, position).trim();
      // console.log('cleanObject bundled', bundled);
      const value = bundled?.replace(toRemove, '')?.trim();
      // console.log('cleanObject name', name);
      // console.log('cleanObject value', value);
      if (name != undefined && name != '' && name != ' ')
        options.object[name] = Extractor.extract(value);
      else options.object = Extractor.extract(value);
      // console.log('cleanObject current', object);

      // console.log(
      //   'cleanObject index',
      //   index,
      //   '-',
      //   position,
      //   '-',
      //   name,
      //   '-',
      //   value,
      //   '-',
      //   bundled
      // );
      const lastIndex = index;
      index = (position === -1 ? index : position) + (bundled?.length || 1);
      // console.log('cleanObject index', index, lastIndex, position);
      if (index === lastIndex) break;
      // console.log(
      //   'cleanObject index',
      //   index,
      //   '-',
      //   objectString,
      //   '-',
      //   objectString.length,
      //   '-',
      //   object
      // );
    }
    // console.log('cleanObject end', object);
    return options.object;
  }

  public static cleanTernary(
    options: {
      string: string;
      start: number;
      end: number;
    },
    removeOuter?: boolean,
    precedence = Precedence.ternary
  ) {
    // console.log('Clean Ternary:', string);
    const ifEl = options.string.substring(0, options.start).trim();
    const thenEl = options.string
      .substring(options.start + 1, options.end)
      .trim();

    const toRemove = Extractor.regex(precedence);

    const elseEl = options.string
      .substring(options.end + 1)

      .replaceAll(toRemove, '')
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

  public static cleanOption(
    options,
    removeOuter?: boolean,
    precedence = Precedence.or
  ) {
    if (options.length == 1) return options[0];
    return precedence === Precedence.and ? { and: options } : { or: options };
  }

  public static cleaner(
    string: string,
    cleanFunction: (
      options: {
        string: string;
        start: number;
        end: number;
        object?: any;
      },
      removeOuter?: boolean,
      precedence?: Precedence
    ) => any,
    precedence: Precedence,
    match: Array<string> = [],
    starts: Array<number> = [],
    ends: Array<number> = [],
    removeOuter?: boolean,
    object = {}
  ) {
    const opens = Extractor.getOpen(precedence);
    const closes = Extractor.getClose(precedence);
    // console.log('Cleaner:', string);
    if (starts.length > 0 && ends.length > 0) {
      const start = match[0];
      const startIndex = Extractor.getPosition(starts);
      const typeIndex = opens.indexOf(start);
      const end = closes[typeIndex];

      let num = 0;
      for (let index = 0; index < match.length; index++) {
        const element = match[index];
        if (element === start) num++;
        else if (element === end) num--;
        if (num === 0) {
          const startSize = match?.filter((s) => opens.includes(s)).length || 0;
          const pIndex = index - startSize;

          const endIndex = Extractor.getPosition(ends, pIndex);
          return cleanFunction(
            { string, start: startIndex, end: endIndex, object },
            removeOuter
          );
        }
      }
    }
    return Extractor.getValue(string);
  }

  public static bundler(
    receivedString: string,
    precedence: Precedence,
    removeOuter?: boolean,
    object = {}
  ) {
    let string = '' + receivedString;
    console.log('Bundler S:', precedence, string);
    const stack: Array<number> = [];
    const starts: Array<number> = [];
    const ends: Array<number> = [];
    const match: Array<string> = [];
    const opens = Extractor.getOpen(precedence);
    const closes = Extractor.getClose(precedence);
    const hides = Extractor.getToHide(precedence);
    const regex = Extractor.groupSimpleRegex(
      Extractor.simpleRegex(Extractor.getOpen(precedence))
    );
    const toSplit = Extractor.regex(precedence);
    const hideFunction = (string) => Extractor.bundler(string, precedence + 1);
    const cleanFunction = Extractor.getCleanFunction(precedence);

    // console.log('Bundler S:', string);
    const positions = Extractor.getPosistions(precedence);
    console.log('Bundler P:', positions, precedence);
    if (positions.length <= 1) return string;
    else if (positions.length === 2) {
      let options: any[] = [];
      // console.log('extractOption', string, option);
      console.log('extractOption E', string, regex, toSplit);

      options = string
        .split(toSplit)
        .filter((s) => s && s != undefined && !regex.includes(s))
        .map((s) => s.trim());

      // console.log('extractOption options:', options, string, toSplit);

      options = options.map((o) =>
        typeof o === 'string' ? Extractor.extract(o) : o
      );
      console.log('extractOption 1:', string, '-', regex, '-', options);
      if (options.length == 1) return options[0];
      return cleanFunction(options, false, precedence);
    } else {
      console.log('extractOption F', string, regex, toSplit);
      for (let index = 0; index < string.length; index++) {
        const element = string[index];
        const startIndex = opens.indexOf(element);
        const endIndex = closes.indexOf(element);
        const hideIndex = hides?.indexOf?.(element);

        if (hideIndex != undefined && hideIndex > -1) {
          const pg = string.substring(index);
          // console.log('pg:', pg);
          const g = hideFunction(pg);
          // console.log('g:', g);
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
          // console.log('Bundler E:', string, '-', match, '-', starts, '-', ends);
          return Extractor.cleaner(
            string,
            cleanFunction,
            precedence,
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
        // console.log('Bundler E2:', string, '-', match, '-', starts, '-', ends);
        return Extractor.cleaner(
          string,
          cleanFunction,
          precedence,
          match,
          starts,
          ends,
          removeOuter,
          object
        );
      }
      ends.push(string.length);
      match.push(closes[0]);
      string += closes[0];
      // console.log('Bundler E3:', string, '-', match, '-', starts, '-', ends);
      const clean = Extractor.cleaner(
        string,
        cleanFunction,
        precedence,
        match,
        starts,
        ends,
        removeOuter,
        object
      );
      // console.log('Bundler clean:', endTypes, clean);
      const endt = Array.isArray(closes) ? closes.join('') : closes;
      const term = new RegExp(`^[${endt}]|[${endt}]$`, 'g');
      const cleanString =
        typeof clean === 'string' ? clean.trim().replaceAll(term, '') : clean;
      // console.log('Bundler cleanString:', cleanString);
      return cleanString;
    }
  }

  // public static bundler2(receivedString: string, and?: boolean) {
  //   const string = '' + receivedString;
  //   const option = and ? Extractor.andRegex : Extractor.orRegex;
  //   let options: any[] = [];
  //   // console.log('extractOption', string, option);
  //   const toSplit = new RegExp(
  //     `(${option})+(?![^${Extractor.openRegex}]*[${Extractor.closeRegex}])`,
  //     'gm'
  //   );
  //   console.log('extractOption E', string, option, toSplit);

  //   options = string
  //     .split(toSplit)
  //     .filter((s) => s && s != undefined && !option.includes(s))
  //     .map((s) => s.trim());

  //   // console.log('extractOption options:', options, string, toSplit);

  //   if (!and && string.includes('&'))
  //     options = options.map((o) => Extractor.bundler2(o, true));
  //   console.log('extractOption 0:', string, option, options);
  //   options = options.map((o: any) =>
  //     typeof o === 'string' ? Extractor.extract(o) : o
  //   );
  //   console.log('extractOption 1:', string, '-', option, '-', options);
  //   if (options.length == 1) return options[0];
  //   return and ? { and: options } : { or: options };
  // }

  // public static bundler3(
  //   receivedString: string,
  //   cleanFunction: (
  //     string: string,
  //     start: number,
  //     end: number,
  //     removeOuter?: boolean
  //   ) => any,
  //   startTypes: string | string[],
  //   endTypes: string | string[],
  //   hideTypes?: string | string[],
  //   hideFunction?: (string: string) => string,
  //   removeOuter?: boolean,
  //   object = {}
  // ): any {
  //   let string = '' + receivedString;
  //   const stack: Array<number> = [];
  //   const starts: Array<number> = [];
  //   const ends: Array<number> = [];
  //   const match: Array<string> = [];
  //   startTypes = [...startTypes];
  //   endTypes = [...endTypes];

  //   // console.log('Bundler S:', string);

  //   for (let index = 0; index < string.length; index++) {
  //     const element = string[index];
  //     const startIndex = startTypes.indexOf(element);
  //     const endIndex = endTypes.indexOf(element);
  //     const hideIndex = hideTypes?.indexOf?.(element);

  //     if (
  //       hideIndex != undefined &&
  //       hideFunction != undefined &&
  //       hideIndex > -1
  //     ) {
  //       const pg = string.substring(index);
  //       // console.log('pg:', pg);
  //       const g = hideFunction(pg);
  //       // console.log('g:', g);
  //       index += (g?.length || 1) - 1;
  //       continue;
  //     }

  //     if (startIndex === -1 && endIndex === -1) continue;

  //     if (startIndex > -1) {
  //       stack.push(startIndex);
  //       starts.push(index);
  //       match.push(element);
  //     } else if (stack.pop() !== endIndex) {
  //       console.error('Bundler Error:', string, '-', stack);
  //       return undefined;
  //     } else {
  //       ends.push(index);
  //       match.push(element);
  //     }

  //     if (stack.length === 0 && (match?.length || 0) > 0) {
  //       // console.log('Bundler E:', string, '-', match, '-', starts, '-', ends);
  //       return Extractor.cleaner(
  //         string,
  //         cleanFunction,
  //         startTypes,
  //         endTypes,
  //         match,
  //         starts,
  //         ends,
  //         removeOuter,
  //         object
  //       );
  //     }
  //   }
  //   if (stack.length === 0) {
  //     // if (ends.length === 0) {
  //     //   ends.push(string.length);
  //     //   match.push(endTypes[0]);
  //     //   string += endTypes[0];
  //     // }
  //     // console.log('Bundler E2:', string, '-', match, '-', starts, '-', ends);
  //     return Extractor.cleaner(
  //       string,
  //       cleanFunction,
  //       startTypes,
  //       endTypes,
  //       match,
  //       starts,
  //       ends,
  //       removeOuter,
  //       object
  //     );
  //   }
  //   ends.push(string.length);
  //   match.push(endTypes[0]);
  //   string += endTypes[0];
  //   // console.log('Bundler E3:', string, '-', match, '-', starts, '-', ends);
  //   const clean = Extractor.cleaner(
  //     string,
  //     cleanFunction,
  //     startTypes,
  //     endTypes,
  //     match,
  //     starts,
  //     ends,
  //     removeOuter,
  //     object
  //   );
  //   // console.log('Bundler clean:', endTypes, clean);
  //   const endt = Array.isArray(endTypes) ? endTypes.join('') : endTypes;
  //   const term = new RegExp(`^[${endt}]|[${endt}]$`, 'g');
  //   const cleanString =
  //     typeof clean === 'string' ? clean.trim().replaceAll(term, '') : clean;
  //   // console.log('Bundler cleanString:', cleanString);
  //   return cleanString;
  // }

  // public static cleaner(
  //   string: string,
  //   cleanFunction: (
  //     string: string,
  //     start: number,
  //     end: number,
  //     removeOuter?: boolean,
  //     object?: any
  //   ) => any,
  //   startTypes: string | string[],
  //   endTypes: string | string[],
  //   match: Array<string> = [],
  //   starts: Array<number> = [],
  //   ends: Array<number> = [],
  //   removeOuter?: boolean,
  //   object = {}
  // ) {
  //   // console.log('Cleaner:', string);
  //   if (
  //     starts != undefined &&
  //     ends != undefined &&
  //     starts.length > 0 &&
  //     ends.length > 0
  //   ) {
  //     const start = match[0];
  //     const startIndex = Extractor.getPosition(starts);
  //     const typeIndex = startTypes.indexOf(start);
  //     const end = endTypes[typeIndex];

  //     let num = 0;
  //     for (let index = 0; index < match.length; index++) {
  //       const element = match[index];
  //       if (element === start) num++;
  //       else if (element === end) num--;
  //       if (num === 0) {
  //         const startSize =
  //           match?.filter((s) => startTypes.includes(s)).length || 0;
  //         const pIndex = index - startSize;

  //         const endIndex = Extractor.getPosition(ends, pIndex);
  //         return cleanFunction(
  //           string,
  //           startIndex,
  //           endIndex,
  //           removeOuter,
  //           object
  //         );
  //       }
  //     }
  //   }
  //   return Extractor.getValue(string);
  // }

  // public static getValue(value: string) {
  //   // console.log('Value:', value);
  //   if (value == undefined) return value;
  //   try {
  //     return JSON.parse(value);
  //   } catch (error) {
  //     // console.log('Value Error:', value);
  //     return value;
  //   }
  // }

  // public static cleanBundle(
  //   string: string,
  //   start: number,
  //   end: number,
  //   removeOuter?: boolean
  // ) {
  //   // console.log('CleanBundle:', string);
  //   string = string
  //     .trim()
  //     .slice(start + (removeOuter ? 1 : 0), end + 1 - (removeOuter ? 1 : 0));
  //   return Extractor.getValue(string);
  // }

  // public static cleanObject(
  //   string: string,
  //   start: number,
  //   end: number,
  //   object = {}
  // ) {
  //   // console.log('Clean Object:', string, start, end);
  //   const objectString = string.substring(start + 1, end).trim();
  //   const openBrackets = Extractor.openBrackets;
  //   const closeBrackets = Extractor.closeBrackets;

  //   const hideFunction = (string) =>
  //     Extractor.bundler3(
  //       string,
  //       Extractor.cleanBundle,
  //       openBrackets,
  //       closeBrackets
  //     );

  //   // console.log('cleanObject init', objectString, objectString.length);

  //   const toRemove = new RegExp(
  //     `[${Extractor.propertyEquals + Extractor.terminator}]+(?![^${
  //       Extractor.openRegex
  //     }]*[${Extractor.closeRegex}])`,
  //     'g'
  //   );

  //   let index = 0;
  //   while (index < objectString.length) {
  //     const currentString = objectString.substring(index).trim();
  //     // console.log('cleanObject start', currentString, currentString.length);
  //     const bundledElement = Extractor.bundler3(
  //       currentString,
  //       Extractor.cleanBundle,
  //       Extractor.propertyEquals,
  //       Extractor.terminator,
  //       Extractor.openBrackets + Extractor.closeBrackets,
  //       hideFunction
  //     );
  //     const bundled =
  //       typeof bundledElement === 'string'
  //         ? bundledElement.trim()
  //         : bundledElement;
  //     // console.log('cleanObject bundled', bundled);
  //     const position = objectString.indexOf(bundled, index);
  //     // console.log('cleanObject position', position);
  //     const name = objectString.substring(index, position).trim();
  //     // console.log('cleanObject bundled', bundled);
  //     const value = bundled?.replace(toRemove, '')?.trim();
  //     // console.log('cleanObject name', name);
  //     // console.log('cleanObject value', value);
  //     if (name != undefined && name != '' && name != ' ')
  //       object[name] = Extractor.extract(value);
  //     else object = Extractor.extract(value);
  //     // console.log('cleanObject current', object);

  //     // console.log(
  //     //   'cleanObject index',
  //     //   index,
  //     //   '-',
  //     //   position,
  //     //   '-',
  //     //   name,
  //     //   '-',
  //     //   value,
  //     //   '-',
  //     //   bundled
  //     // );
  //     const lastIndex = index;
  //     index = (position === -1 ? index : position) + (bundled?.length || 1);
  //     // console.log('cleanObject index', index, lastIndex, position);
  //     if (index === lastIndex) break;
  //     // console.log(
  //     //   'cleanObject index',
  //     //   index,
  //     //   '-',
  //     //   objectString,
  //     //   '-',
  //     //   objectString.length,
  //     //   '-',
  //     //   object
  //     // );
  //   }
  //   // console.log('cleanObject end', object);
  //   return object;
  // }

  // public static cleanTernary(
  //   string: string,
  //   start: number,
  //   end: number //,
  //   // removeOuter?: boolean
  // ) {
  //   // console.log('Clean Ternary:', string);
  //   const ifEl = string.substring(0, start).trim();
  //   const thenEl = string.substring(start + 1, end).trim();

  //   const toRemove = new RegExp(
  //     `[${Extractor.terminator}]+(?![^${Extractor.openRegex}]*[${Extractor.closeRegex}])`,
  //     'g'
  //   );

  //   const elseEl = string
  //     .substring(end + 1)

  //     .replaceAll(toRemove, '')
  //     .trim();
  //   // console.log('ifEl:', ifEl, typeof ifEl);
  //   // console.log('thenEl:', thenEl, typeof thenEl);
  //   // console.log('elseEl:', elseEl, typeof elseEl);

  //   return {
  //     if: typeof ifEl === 'string' ? Extractor.extract(ifEl) : ifEl,
  //     then: typeof thenEl === 'string' ? Extractor.extract(thenEl) : thenEl,
  //     else: typeof elseEl === 'string' ? Extractor.extract(elseEl) : elseEl,
  //   };
  // }

  public static getNext = (
    receivedString: string | string[],
    index: number
  ) => {
    const string = receivedString + '';
    const next = index + 1 < string.length ? string[index + 1] : undefined;
    if (next === ' ' || next === '\n')
      return Extractor.getNext(string, index + 1);
    return next;
  };

  public static checkComparation(receivedString: string) {
    const string = receivedString + '';
    let min = Infinity;
    let minElementIndex;
    for (let index = 0; index < Extractor.comparation.length; index++) {
      const element = Extractor.comparation[index];
      const newI = string?.indexOf
        ? string.indexOf(element)
        : element == string
        ? 0
        : -1;
      const next = Extractor.getNext(string, newI);
      const hasNext =
        (string?.indexOf ? string.indexOf(next) : next == string ? 0 : -1) ===
        -1
          ? false
          : true;
      // console.log('checkComparation', element, newI, next, hasNext);
      if (newI != -1 && (min > newI || min == Infinity) && hasNext) {
        min = newI;
        minElementIndex = index;
      }
    }
    // console.log('checkComparation', min, minElementIndex, string);
    return minElementIndex;
  }

  // public static extract(receivedString?: string): any {
  //   let string = '' + receivedString;
  //   const elements = [
  //     ...Extractor.options,
  //     ...Extractor.ternary,
  //     ...Extractor.object,
  //   ];
  //   string = string?.replaceAll('?.', '.')?.replaceAll('!.', '.')?.trim();

  //   if (string == undefined) return string;

  //   // console.log('Extract:', string);

  //   const tempBundle = Extractor.bundler3(
  //     string,
  //     Extractor.cleanBundle,
  //     Extractor.bOpenBrackets,
  //     Extractor.bCloseBrackets
  //   );

  //   const isBundle = tempBundle == string;
  //   // console.log('Extract b:', string);

  //   string = isBundle
  //     ? Extractor.bundler3(
  //         string,
  //         Extractor.cleanBundle,
  //         Extractor.bOpenBrackets,
  //         Extractor.bCloseBrackets,
  //         undefined,
  //         undefined,
  //         true
  //       )
  //     : string;

  //   let min = Infinity;
  //   let foundElement;
  //   let hasTernary = false;
  //   // let isObject = false;
  //   for (let index = 0; index < elements.length; index++) {
  //     const element = elements[index];
  //     const newI = string?.indexOf
  //       ? string.indexOf(element)
  //       : element == string
  //       ? 0
  //       : -1;
  //     const next = Extractor.getNext(elements, index);
  //     if (newI != -1) {
  //       const hasAThen = Extractor.then.includes(element);
  //       const hasAElse = Extractor.else.includes(element);

  //       if (hasAThen) {
  //         const found = [...Extractor.else].reduce(
  //           (r, element) => r || string.includes(element),
  //           false
  //         );
  //         if (found) hasTernary = true;
  //       } else if (hasAElse) {
  //         const found = [...Extractor.then].reduce(
  //           (r, element) => r || string.includes(element),
  //           false
  //         );
  //         if (found) hasTernary = true;
  //       }

  //       if ((min > newI || min == Infinity) && next != '.') {
  //         min = newI;
  //         foundElement = element;
  //       }
  //     }
  //   }

  //   // const isAObject = Extractor.object.includes(foundElement);
  //   // if (isAObject) {
  //   //   console.log('hasAObject', foundElement);
  //   //   isObject = true;
  //   // }

  //   // console.log(
  //   //   'extract:',
  //   //   foundElement,
  //   //   '-',
  //   //   min,
  //   //   '-',
  //   //   string,
  //   //   '-',
  //   //   elements,
  //   //   '-',
  //   //   hasTernary,
  //   //   '-',
  //   //   Extractor.ternary,
  //   //   // '-',
  //   //   // isObject,
  //   //   '-',
  //   //   Extractor.object
  //   // );

  //   if (foundElement == undefined) {
  //     const compare = Extractor.checkComparation(string);
  //     if (compare != undefined) return Extractor.getValue(string);
  //     const bundle = Extractor.bundler3(
  //       string,
  //       Extractor.cleanBundle,
  //       Extractor.openBrackets,
  //       Extractor.closeBrackets,
  //       undefined,
  //       undefined,
  //       true
  //     );
  //     return bundle;
  //   }

  //   // console.log('extract 2:', string);

  //   if (Extractor.options.includes(foundElement) && !hasTernary)
  //     return Extractor.bundler2(string); // '|' or '&'

  //   if (Extractor.ternary.includes(foundElement) || hasTernary)
  //     return Extractor.bundler3(
  //       string,
  //       Extractor.cleanTernary,
  //       Extractor.then,
  //       Extractor.else,
  //       Extractor.openBrackets + Extractor.closeBrackets,
  //       (string) =>
  //         Extractor.bundler3(
  //           string,
  //           Extractor.cleanBundle,
  //           Extractor.openBrackets,
  //           Extractor.closeBrackets
  //         )
  //     ); // '?' or ':'

  //   if (Extractor.object.includes(foundElement)) {
  //     // console.log('extract preObject', string);
  //     const hideFunction = (string) =>
  //       Extractor.bundler3(
  //         string,
  //         Extractor.cleanBundle,
  //         Extractor.bOpenBrackets,
  //         Extractor.bCloseBrackets
  //       );

  //     return Extractor.bundler3(
  //       string,
  //       Extractor.cleanObject,
  //       Extractor.openObject,
  //       Extractor.closeObject,
  //       Extractor.bBrackets,
  //       hideFunction
  //     );
  //   }
  //   return Extractor.getValue(string);
  // }

  public static extract(receivedString?: string): any {
    let string = '' + receivedString;
    string = string?.replaceAll('?.', '.')?.replaceAll('!.', '.')?.trim();

    if (string == undefined) return string;

    for (
      let precedence = Precedence.ternary;
      precedence <= Precedence.group;
      precedence++
    ) {
      const regex = Extractor.regex(precedence);
      console.log('regex:', regex, precedence, string);
      if (string.match(regex)) return Extractor.bundler(string, precedence);
    }

    return Extractor.getValue(string);
  }
}

export { Extractor };
