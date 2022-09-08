/* eslint-disable no-unused-vars */
enum Precedence {
  ternary, // a ? b : c -> hide each element then extract one by one again -> /(?:\?|\:)+(?![^\{\[\(\<]*[\}\]\)\>])/gm
  assignment, // a =/: b -> hide each element then extract one by one again -> /(?<!\:|\=)\:|\=(?![\:\=])(?![^\{\[\(\<]*[\}\]\)\>])/gm OR /(?:[^\:|\=]+?)(\:|\=)(?:[^\:|\=]+?)(?![^\{\[\(\<]*[\}\]\)\>])/gm
  or, // a ||/| b -> hide each element then extract one by one again -> /(\|)+(?![^\{\[\(\<]*[\}\]\)\>])/gm
  and, // a &&/& b -> hide each element then extract one by one again -> /(\&)+(?![^\{\[\(\<]*[\}\]\)\>])/gm
  comparation, // a [><=]=(=) b -> hide each element then extract one by one again -> /[\!\>\<\:\=]+\:|\=(?![^\{\[\(\<]*[\}\]\)\>])/gm
  object, // /{a/} -> hide each element then extract one by one again -> /(?:\{|\})+(?![^\[\(\<]*[\]\)\>])/gm OR ^(\{)([\{\[\(\<]*.+[\}\]\)\>]*)*(\})$
  group, // /[/(/<a/>/)/] -> evaluate the inner element -> /(?:\(|\[|\]|\))+/gm
}

enum NumberOfElements {
  justOne,
  one, // (OPENING) a (CLOSING)
  oneOrMore, // (CLOSING) a
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

  public static comparationD = '><';
  public static comparationDiff = '!' + Extractor.comparationD;
  public static comparation = Extractor.comparationDiff + '=';

  public static comparationDTypes = {
    '>': 'greater',
    '<': 'less',
  };

  public static getPrecedence(string: string) {
    if (Extractor.ternary.includes(string)) {
      return Precedence.ternary;
    }
    if (Extractor.equals.includes(string)) {
      return Precedence.assignment;
    }
    if (Extractor.or.includes(string)) {
      return Precedence.or;
    }
    if (Extractor.and.includes(string)) {
      return Precedence.and;
    }
    if (Extractor.comparation.includes(string)) {
      return Precedence.comparation;
    }
    if (Extractor.object.includes(string)) {
      return Precedence.object;
    }
    return Precedence.group;
  }

  public static getCleanFunction(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return Extractor.cleanTernary;
      case Precedence.assignment:
        return Extractor.cleanAssignment;
      case Precedence.or:
        return Extractor.cleanOption;
      case Precedence.and:
        return Extractor.cleanOption;
      case Precedence.comparation:
        return Extractor.cleanComparation;
      case Precedence.object:
        return Extractor.cleanObject;
      default:
        return Extractor.cleanBundle;
    }
  }

  public static numberOfElements(precedence: Precedence) {
    switch (precedence) {
      case Precedence.ternary:
        return NumberOfElements.one;
      case Precedence.assignment:
        return NumberOfElements.justOne;
      case Precedence.or:
        return NumberOfElements.oneOrMore;
      case Precedence.and:
        return NumberOfElements.oneOrMore;
      case Precedence.comparation:
        return NumberOfElements.oneOrMore;
      case Precedence.object:
        return NumberOfElements.one;
      default:
        return NumberOfElements.oneOrMore;
    }
  }

  public static hasAdicionalEquals(precedence: Precedence) {
    switch (precedence) {
      case Precedence.comparation:
        return true;
      default:
        return false;
    }
  }

  public static regex(
    precedence: Precedence,
    fOpen?: string | Array<string>,
    fClose?: string | Array<string>,
    withTerminator = false
  ) {
    const all = [
      ...Extractor.getOpen(precedence),
      ...Extractor.getClose(precedence),
      ...(withTerminator ? Extractor.terminator : []),
    ];
    const regex = Extractor.groupSimpleRegex(
      Extractor.simpleRegex(
        all,
        Extractor.numberOfElements(precedence),
        Extractor.hasAdicionalEquals(precedence)
      )
    );
    const filterOpen = fOpen || '';
    const filterClose = fClose || '';
    const hideOpen = Extractor.simpleRegex(
      [...Extractor.getToHideOC(precedence), ...filterOpen],
      undefined,
      undefined,
      all
    );
    const hideClose = Extractor.simpleRegex(
      [...Extractor.getToHideOC(precedence, true), ...filterClose],
      undefined,
      undefined,
      all
    );
    const hideOG =
      hideOpen.length > 0 ? hideOpen.replace('[', '[^') : undefined;
    const hideCG = hideClose.length > 0 ? `${hideClose}` : undefined;
    const hideG =
      hideOG && hideCG
        ? `(?!${hideOG}*${hideCG})`
        : hideOG
        ? `(?!${hideOG}*)`
        : hideCG
        ? `(?!${hideCG}*)`
        : '';
    // console.log('precedence:', precedence);
    // // console.log('hideOpen:', hideOpen);
    // // console.log('hideClose:', hideClose);
    // console.log('regex:', regex);
    // console.log('hideOG:', hideOG);
    // console.log('hideCG:', hideCG);
    // console.log('hideG:', hideG);
    return new RegExp(`${regex}${hideG}`, 'gm');
  }

  public static simpleRegex(
    receivedString: string[] | string,
    numberOfElements = NumberOfElements.one,
    hasAdicionalEquals = false,
    toFilter?: string[] | string
  ) {
    let string = receivedString;
    if (Array.isArray(string)) {
      string = string.filter((s, index) => {
        if (index > 0) {
          const sl = string[index - 1];
          if (sl.includes(s) || s.includes(sl)) return false;
        }
        return true;
      });
    }

    if (toFilter) {
      string = [...string].filter((s) => !toFilter.includes(s));
    }

    let add = '';
    if (hasAdicionalEquals) {
      add = '[' + [...Extractor.getOpen(Precedence.assignment)].join('') + ']';
    }

    switch (numberOfElements) {
      case NumberOfElements.justOne:
        const group = [...string].map((s) => Extractor.char + s).join('');
        return '(?<!' + group + ')' + group + add;

      case NumberOfElements.one:
        return (
          '[' + [...string].map((s) => Extractor.char + s).join('') + ']' + add
        );

      case NumberOfElements.oneOrMore:
        return (
          '[' +
          [...string].map((s) => Extractor.char + s).join('') +
          ']' +
          '+' +
          add
        );
    }
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
    // console.log('hideOC done:', toHide);
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
        // console.log('hide done:', toHide);
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
    console.log('Value:', value);
    if (value == undefined) return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      const newValue = value
        .split(new RegExp(`[${Extractor.terminator}]`, 'gm'))[0]
        .trim();
      if (newValue == value)
        return value.includes("'") || value.includes('"')
          ? value.replaceAll('"', '').replaceAll("'", '')
          : `@{${value}}`;
      return Extractor.getValue(newValue);
    }
  }

  public static getComparationType(string: string) {
    const match = string.match(new RegExp(`[${Extractor.comparationD}]`));
    if (match) {
      return (
        Extractor.comparationDTypes[match[0]] +
        (match.includes('=') ? 'OrEqualTo' : 'Than')
      );
    }
    return string.includes('!') ? 'notEqualTo' : 'equalTo';
  }

  public static cleanAssignment(options: { string: string; object }) {
    const toSplit = new RegExp(`[${Extractor.equals}]`, 'gm');
    const elements = options.string.split(toSplit);

    console.log('cleanAssignment elements', elements);
    const name = Extractor.extract(elements?.[0]?.trim());
    const value = Extractor.extract(elements?.[1]?.trim());
    console.log('cleanAssignment name', name);
    console.log('cleanAssignment value', value);
    if (name != undefined && name != '' && name != ' ')
      options.object[name] = value;
    else options.object = value;
    return options.object;
  }

  public static cleanComparation(options: { string: string; object }) {
    const toSplit = new RegExp(`[${Extractor.comparation}]`, 'gm');
    console.log('cleanComparation', options.string);
    const elements = options.string
      .split(toSplit)
      .filter((e) => e && e.trim() != '')
      .map((e) => e.trim());

    console.log('cleanComparation elements', elements);
    const name = Extractor.extract(elements?.[0]?.trim());
    const type = Extractor.getComparationType(options.string);
    const value = Extractor.extract(elements?.[1]?.trim());
    console.log('cleanComparation name', name);
    console.log('cleanComparation value', value);
    if (name != undefined && name.trim() != '') {
      options.object[name] = {};
      if (type != undefined && type.trim() != '')
        options.object[name][type] = value;
      else options.object[name] = value;
    } else {
      if (type != undefined && type.trim() != '') options.object[type] = value;
      else options.object = value;
    }
    return options.object;
  }

  public static cleanBundle(
    options: {
      string: string;
      start: number;
      end: number;
    },
    removeOuter?: boolean
  ) {
    // console.log('CleanBundle:', options, removeOuter);
    options.string = options.string
      .trim()
      .slice(
        options.start + (removeOuter ? 1 : 0),
        options.end + 1 - (removeOuter ? 1 : 0)
      );
    // console.log('CleanBundle end:', options.string);
    return Extractor.extract(options.string);
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
    console.log('CleanObject:', options, removeOuter);

    const toRemove = Extractor.regex(precedence);
    const toSplit = Extractor.regex(
      Precedence.object,
      undefined,
      undefined,
      true
    );

    const objects = options.string
      .substring(options.start, options.end)
      .trim()
      .split(toRemove)
      .join()
      .split(toSplit)
      .map((value) => value.trim())
      .filter((value) => value && value.length > 0);

    console.log('cleanObject init', objects, objects.length, toRemove, toSplit);

    for (const object of objects) {
      const currentString = object.trim();
      console.log('cleanObject start', currentString, currentString.length);
      options.object = Extractor.cleanAssignment({
        string: currentString,
        object: options.object,
      });
    }
    console.log('cleanObject end', options.object);
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
    console.log('CleanTernary:', options, removeOuter, precedence);
    const ifEl = options.string.substring(0, options.start).trim();
    const thenEl = options.string
      .substring(options.start + 1, options.end)
      .trim();

    // const toRemove = Extractor.regex(precedence);

    // const terminator = Extractor.regex(
    //   Precedence.ternary,
    //   undefined,
    //   undefined,
    //   true
    // );

    const elseEl = options.string
      .substring(options.end + 1)
      // .replaceAll(toRemove, '')
      // .split(terminator)[0]
      .trim();
    console.log('ifEl:', ifEl, typeof ifEl);
    console.log('thenEl:', thenEl, typeof thenEl);
    console.log('elseEl:', elseEl, typeof elseEl);

    return {
      if:
        typeof ifEl === 'string'
          ? Extractor.extract(ifEl)
          : Extractor.getValue(ifEl),
      then:
        typeof thenEl === 'string'
          ? Extractor.extract(thenEl)
          : Extractor.getValue(thenEl),
      else:
        typeof elseEl === 'string'
          ? Extractor.extract(elseEl)
          : Extractor.getValue(elseEl),
    };
  }

  public static cleanOption(
    options,
    removeOuter?: boolean,
    precedence = Precedence.or
  ) {
    options
      .map((option) =>
        precedence === Precedence.and
          ? option.and != undefined
            ? option.and
            : option
          : option.or != undefined
          ? option.or
          : option
      )
      .flat();
    // console.log('CleanOption:', options, removeOuter, Precedence[precedence]);
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
    object = {},
    toHide?: boolean
  ) {
    const opens = Extractor.getOpen(precedence);
    const closes = Extractor.getClose(precedence);
    console.log(
      'Cleaner:',
      string,
      Precedence[precedence],
      removeOuter,
      starts,
      ends,
      toHide
    );
    if (starts.length > 0 && ends.length > 0) {
      const start = match[0];
      const startIndex = Extractor.getPosition(starts);
      const typeIndex = opens.indexOf(start);
      const end = closes[typeIndex];
      let num = 0;

      for (let index = 0; index < match.length; index++) {
        const element = match[index];
        console.log('Cleaner element:', element, start, end, startIndex);
        if (element === start) num++;
        else if (element === end) num--;
        if (num === 0) {
          console.log('Cleaner 0!');
          const startSize = match?.filter((s) => opens.includes(s)).length || 0;
          const pIndex = index - startSize;

          const endIndex = Extractor.getPosition(ends, pIndex);

          console.log('Cleaner 1!', toHide, endIndex);

          if (toHide) return string.substring(startIndex, endIndex + 1);

          console.log('Cleaner 2!', cleanFunction, string);

          const clean = cleanFunction(
            { string, start: startIndex, end: endIndex, object },
            removeOuter
          );
          console.log('CLEAN E:', clean);

          return clean;
        }
      }
    }
    console.log('CLEAN:', object, string);
    if (toHide) return string;
    return Extractor.getValue(string);
  }

  public static bundler(
    receivedString: string,
    receivedPrecedence: Precedence,
    rmOuter?: boolean,
    object = {},
    toHide?: boolean,
    filterPrecedence?: Precedence
  ) {
    let string = '' + receivedString;
    const precedence = receivedPrecedence;
    const stack: Array<number> = [];
    const starts: Array<number> = [];
    const ends: Array<number> = [];
    const match: Array<string> = [];
    const opens = Extractor.getOpen(precedence);
    const closes = Extractor.getClose(precedence);
    const hides = Extractor.getToHide(precedence); //rHides ||
    const toSplit = Extractor.regex(precedence);
    const cleanFunction = Extractor.getCleanFunction(precedence);

    const removeOuter = rmOuter || precedence === Precedence.group;

    // const filter = [...(filterOpen || []), ...(filterClose || [])];
    // const splitter =
    //   filter.length > 0 ? new RegExp(`[${filter.join('')}]`, 'gm') : undefined;
    const splitter =
      filterPrecedence != undefined
        ? Extractor.regex(filterPrecedence)
        : undefined;
    string = splitter ? string.split(splitter)[0].trim() : string.trim();

    console.log(
      'Bundler S:',
      Precedence[precedence],
      string,
      toHide,
      // filter,
      splitter,
      toSplit
    );
    const positions = Extractor.getPosistions(precedence);
    // console.log('Bundler P:', positions, precedence);
    if (precedence === Precedence.object) {
      if (toHide) return string;
      return Extractor.cleanObject({
        string,
        start: 0,
        end: string.length,
        object,
      });
    } else if (precedence === Precedence.comparation) {
      if (toHide) return string;
      return Extractor.cleanComparation({
        string,
        object,
      });
    } else if (positions.length === 2) {
      let options: any[] = [];
      const regex = Extractor.groupSimpleRegex(
        Extractor.simpleRegex(
          opens,
          Extractor.numberOfElements(precedence),
          Extractor.hasAdicionalEquals(precedence)
        )
      );
      // console.log('extractOption', string, option);
      // console.log('extractOption E', string, regex, toSplit);
      if (toHide) return string;

      options = string.split(toSplit);

      options = options
        .filter((s) => s && s != undefined && !regex.includes(s))
        .map((s) => (splitter ? s.trim().split(splitter)[0] : s.trim()));

      // console.log('extractOption options:', options, string, toSplit);
      options = options.map((o) =>
        typeof o === 'string' ? Extractor.extract(o) : o
      );
      // console.log('extractOption 1:', string, '-', regex, '-', options);
      if (options.length == 1) return options[0];
      return cleanFunction(options, false, precedence);
    } else {
      // console.log('extractOption F', string, toSplit);
      for (let index = 0; index < string.length; index++) {
        const element = string[index];
        const startIndex = opens.indexOf(element);
        const endIndex = closes.indexOf(element);
        const hideIndex = hides?.indexOf?.(element);
        // console.log(
        //   'extractOption G',
        //   element,
        //   startIndex,
        //   endIndex,
        //   hideIndex,
        //   hides
        // );

        if (hideIndex != undefined && hideIndex > -1) {
          console.log(
            'extractOption H',
            stack,
            stack.length,
            opens,
            closes,
            element
          );
          const hideFunction = (string) =>
            Extractor.bundler(
              string,
              Extractor.getPrecedence(element),
              undefined,
              object,
              true,
              precedence
            );
          const i = starts.length > 0 ? starts[starts.length - 1] + 1 : 0;
          const pg = string.substring(i);
          console.log('pg:', pg, element);
          const g = hideFunction(pg);
          const foundAt = string.indexOf(g, i);
          const len = (g?.length || 1) - 1;
          index = foundAt + len;
          console.log('g:', g, index, string, foundAt, i, len);
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
          console.log('Bundler E:', string, '-', match, '-', starts, '-', ends);
          return Extractor.cleaner(
            string,
            cleanFunction,
            precedence,
            match,
            starts,
            ends,
            removeOuter,
            object,
            toHide
          );
        }
      }
      if (stack.length === 0) {
        // if (ends.length === 0) {
        //   ends.push(string.length);
        //   match.push(endTypes[0]);
        //   string += endTypes[0];
        // }
        console.log('Bundler E2:', string, '-', match, '-', starts, '-', ends);
        return Extractor.cleaner(
          string,
          cleanFunction,
          precedence,
          match,
          starts,
          ends,
          removeOuter,
          object,
          toHide
        );
      }
      ends.push(string.length);
      match.push(closes[0]);
      string += closes[0];
      console.log('Bundler E3:', string, '-', match, '-', starts, '-', ends);
      const clean = Extractor.cleaner(
        string,
        cleanFunction,
        precedence,
        match,
        starts,
        ends,
        removeOuter,
        object,
        toHide
      );
      // console.log('Bundler clean:', endTypes, clean);
      let endt: string | undefined = [...closes]
        .map((s) => Extractor.char + s)
        .join('');
      // console.log('Bundler clean:', endt, clean);
      if (endt.trim() === '') endt = undefined;
      const term = endt ? new RegExp(`^[${endt}]|[${endt}]$`, 'g') : undefined;
      const cleanString =
        typeof clean === 'string'
          ? term
            ? clean.trim().replaceAll(term, '')
            : clean.trim()
          : clean;
      // console.log('Bundler cleanString:', cleanString);
      return Extractor.getValue(cleanString);
    }
  }

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
      const match = string.match(regex);
      // console.log(
      //   'extract regex:',
      //   regex,
      //   Precedence[precedence],
      //   string,
      //   match
      // );
      if (match && match[0] !== '()')
        return Extractor.bundler(string, precedence);
    }

    return Extractor.getValue(string);
  }
}

export { Extractor };
