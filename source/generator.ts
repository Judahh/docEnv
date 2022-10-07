import { readdir, readFile } from 'fs/promises';
import { Extractor, Precedence } from './extractor';

const baseTypes = [
  'undefined',
  'null',
  'void',
  'unknown',
  'never',
  'any',
  'string',
  'number',
  'boolean',
  'object',
  'symbol',
];

class Generator {
  public static removeComments(content: string) {
    return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  }

  public static goToFile(path?: string, currentPath?: string): string {
    const newPath =
      Generator.removeFile(currentPath || '') + '/' + (path || '') + '.ts';
    return newPath;
  }

  public static removeFile(content: string) {
    return content.replace(/\/[^\/]*\.ts/gm, '').trim();
  }

  public static async generateRouteElement(
    request: string,
    rPath: string,
    rRoutes?: {
      [name: string]: {
        path: string;
        name: string;
      };
    }
  ): Promise<{
    [name: string]: {
      path: string;
      name: string;
    };
  }> {
    const routes: {
      [name: string]: {
        path: string;
        name: string;
      };
    } = rRoutes || {};
    const elements = request.replace(/[\(\)]/g, '').split(',');
    const name = elements[elements.length - 1].replace(/['"]/g, '').trim();
    const path = '/' + Generator.removeFile(rPath.split('/api/')[1]);
    routes[name] = {
      path,
      name,
    };
    return routes;
  }
  public static async generateRoute(
    path: string,
    rRoutes?: {
      [name: string]: {
        path: string;
        name: string;
      };
    }
  ): Promise<{
    [name: string]: {
      path: string;
      name: string;
    };
  }> {
    const routes: {
      [name: string]: {
        path: string;
        name: string;
      };
    } = rRoutes || {};
    const file = await Generator.getFileString(path);
    if (file.withoutComments.includes('request('))
      return await Generator.generateRouteElement(
        '(' + file.withoutComments.split('request(')[1].split(';')[0],
        path,
        routes
      );
    return routes;
  }
  public static async generateRoutes(
    path: string,
    files: string[],
    rRoutes?: {
      [name: string]: {
        path: string;
        name: string;
      };
    }
  ): Promise<{
    [name: string]: {
      path: string;
      name: string;
    };
  }> {
    let routes: {
      [name: string]: {
        path: string;
        name: string;
      };
    } = rRoutes || {};
    for (const file of files) {
      if (file.endsWith('.ts')) {
        routes = await Generator.generateRoute(`${path}/${file}`, routes);
      } else {
        const newPath = `${path}/${file}`;
        const newfiles = await readdir(newPath, 'utf8');
        routes = await Generator.generateRoutes(newPath, newfiles, routes);
      }
    }
    return routes;
  }

  public static async generatePages(
    source: string,
    rFiles: string[]
  ): Promise<{
    [name: string]: {
      path: string;
      name: string;
    };
  }> {
    let path = source;
    let files = rFiles;
    if (files.includes('pages')) {
      path += '/pages';
      files = await readdir(path, 'utf8');
    }
    if (files.includes('api')) {
      path += '/api';
      files = await readdir(path, 'utf8');
    }
    return Generator.generateRoutes(path, files);
  }

  static generateMethods(
    elements: string[],
    page: { path: string; name: string; methods?: Record<string, unknown> }
  ): { path: string; name: string } {
    page.methods = page.methods || {};
    for (const element of elements) {
      switch (element.trim().toLowerCase()) {
        case 'basecontrollercreate':
          page.methods.create = {
            http: ['post'],
          };
          break;
        case 'basecontrollerread':
          page.methods.read = {
            http: ['get'],
          };
          break;
        case 'basecontroller':
          page.methods.create = {
            http: ['post'],
          };
          page.methods.read = {
            http: ['get'],
          };
          page.methods.delete = {
            http: ['delete'],
          };
        case 'basecontrollerupdate':
          page.methods.update = {
            http: ['put', 'patch'],
          };
          break;
        case 'basecontrollerdelete':
          page.methods.delete = {
            http: ['delete'],
          };
          break;
      }
    }
    return page;
  }

  static async generateController(
    source: string,
    rCurrentPath: string | undefined,
    page: { path: string; name: string; controllerPath?: string }
  ): Promise<{ path: string; name: string }> {
    const currentPath = rCurrentPath
      ? Generator.removeFile(rCurrentPath)
      : undefined;
    const path = page?.controllerPath?.match(/^\.\//gm)
      ? page?.controllerPath?.replace(/^\.\//gm, source + '/') + '.ts'
      : page?.controllerPath?.replace(/^\.\.\//gm, currentPath + '/../') +
        '.ts';
    if (path) {
      const file = await Generator.getFileString(path);
      // console.log('FILE:', JSON.stringify(file, null, 5));
      let content = file.withoutComments
        .split('extends')[1]
        .split('{')[0]
        .trim();
      if (content.includes('Mixin')) {
        content = content
          .split(/Mixin\s*\(/gm)[1]
          .split(')')[0]
          .trim();
      }
      const elements = content.split(',');
      return Generator.generateMethods(elements, page);
    }
    return page;
  }

  static async findControllers(
    source: string,
    routePath: string,
    pages: {
      [name: string]: {
        path: string;
        name: string;
      };
    }
  ): Promise<{
    [name: string]: {
      path: string;
      name: string;
    };
  }> {
    const file = await Generator.getFileString(routePath);
    file.withoutComments.replace(
      /\.controller\.(\w+)\s*=\s*(?:new)*\s*(.+?)\(\w*\);/gm,
      (a, group1, group2) => {
        `{group1: ${group1}, group2: ${group2}}`;
        pages[group1.trim()]['controller'] = group2;
        const sRegex = `import\\s*\\{*\\s${group2}\\s*\\}*\\sfrom*\\s(.*?);`;
        const regex = new RegExp(sRegex);
        const match: RegExpMatchArray | undefined =
          file.withoutComments.match(regex) || undefined;
        const path = match?.[1].replace(/['"]/g, '');
        pages[group1.trim()]['controllerPath'] = path;
        return a;
      }
    );
    for (const key in pages) {
      if (Object.prototype.hasOwnProperty.call(pages, key)) {
        pages[key] = await Generator.generateController(
          source,
          routePath,
          pages[key]
        );
      }
    }

    return pages;
  }

  static async generateControllers(
    source: string,
    rFiles: string[],
    pages: {
      [name: string]: {
        path: string;
        name: string;
      };
    }
  ): Promise<{
    [name: string]: {
      path: string;
      name: string;
    };
  }> {
    let path = source;
    let files = rFiles;
    if (files.includes('routes')) {
      path += '/routes';
      files = await readdir(path, 'utf8');
    }
    if (files.includes('route')) {
      path += '/route';
      files = await readdir(path, 'utf8');
    }
    for (const file of files) {
      if (file.includes('.ts')) {
        const route = `${path}/${file}`;
        const newPages = await Generator.findControllers(source, route, pages);
        return newPages;
      }
    }
    return pages;
  }

  public static async generate(sourcePath: string): Promise<any> {
    const folder = await readdir(sourcePath, 'utf8');
    let pages = await Generator.generatePages(sourcePath, folder);
    pages = await Generator.generateControllers(sourcePath, folder, pages);
    pages = await Generator.generateServices(sourcePath, folder, pages);
    return pages;
  }

  static async generateServices(
    sourcePath: string,
    files: string[],
    pages: {
      [name: string]: {
        path: string;
        name: string;
        service?: string;
        controller?: string;
      };
    }
  ): Promise<{ [name: string]: { path: string; name: string } }> {
    for (const key in pages) {
      if (Object.prototype.hasOwnProperty.call(pages, key)) {
        const page = pages[key];
        page.service = page.controller?.replace('Controller', 'Service');
      }
    }
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (file.toLowerCase().includes('service'))
        return await Generator.findServices(`${sourcePath}/${file}`, pages);
    }
    return pages;
  }

  static async findServices(
    path: string,
    pages: {
      [name: string]: {
        path: string;
        name: string;
        service?: string | undefined;
      };
    }
  ): Promise<{ [name: string]: { path: string; name: string } }> {
    const dir = await readdir(path, 'utf8');

    for (const key in pages) {
      if (Object.prototype.hasOwnProperty.call(pages, key)) {
        const lService = pages[key].service?.toLowerCase() + '.ts';
        if (lService)
          for (const file of dir) {
            const route = `${path}/${file}`;
            if (file.includes('.ts')) {
              if (file.toLowerCase() === lService)
                pages[key] = await Generator.generateService(route, pages[key]);
            } else {
              pages = await Generator.findServices(route, pages);
            }
          }
      }
    }

    return pages;
  }

  static getParams(
    prefix: string,
    file: {
      withComments: string;
      withoutComments: string;
    },
    isTriple = false
  ) {
    // console.log('getParams');
    const groupObject = '\\s*?((?:.|\\s)*?)\\s*?';
    const groups = isTriple
      ? `<${groupObject}(?:,${groupObject}){0,1}(?:,${groupObject}){0,1}>`
      : `<${groupObject}(?:,${groupObject}){0,1}>`;
    const sRegex = `\\s*${prefix}\\s*${groups}`;
    const regex = new RegExp(sRegex, 'i');
    // console.log('getParams1', sRegex, content);
    const match: RegExpMatchArray | undefined =
      file.withoutComments.match(regex) || undefined;
    // console.log('getParams2');

    let filter = match?.[1]?.trim();
    let input = match?.[2]?.trim();
    let output = match?.[3]?.trim();

    filter = filter == '' ? undefined : filter;
    input = input == '' ? undefined : input;
    output = output == '' ? undefined : output;

    // console.log('getParams baseContent:', baseContent);
    // console.log('getParams content:', content);
    // console.log('getParams filter:', filter);
    // console.log('getParams input:', input);
    // console.log('getParams output:', output);
    // console.log('getParams outputComments:', outputComments);
    return {
      filter,
      input,
      output,
      // filterComments,
      // inputComments,
      // outputComments,
    };
  }

  static async getMethod(methodName: string, receivedContent: string) {
    // console.log('getMethod0', methodName, receivedContent);
    const reg = `\\s*${methodName}\\s*\\(`;
    const regex = new RegExp(reg, 'imgs');
    const content = receivedContent?.split(regex)[1];
    let match = receivedContent?.match(regex)?.[0];
    // console.log('getMethod1', content);
    const reg2 = `\\s*(?:(?:public)|(?:protected)|(?:private))?\\s*(?:async)?\\s*\\w*\\s*\\(`;
    const regex2 = new RegExp(reg2, 'imgs');
    match = (match || '') + content?.split(regex2)[0];
    // console.log('getMethod2', match);
    return match || '';
  }

  static async generateService(
    path: string,
    page: {
      path: string;
      name: string;
      service?: string | undefined;
      methods?: { [name: string]: Record<string, unknown> };
      baseInput?: string;
      baseOutput?: string;
    }
  ): Promise<{ path: string; name: string }> {
    const file = await Generator.getFileString(path);
    const {
      filter,
      input,
      output,
      // filterComments,
      // inputComments,
      // outputComments,
    } = Generator.getParams(
      `${page.service}\\s*extends\\s*BaseService`,
      file,
      true
    );

    // console.log('generateService1');

    for (const key in page.methods) {
      if (Object.prototype.hasOwnProperty.call(page.methods, key)) {
        const method = page.methods[key];
        const methodContent = await Generator.getMethod(
          key,
          file.withoutComments
        );
        const {
          filter: currentFilter1,
          input: currentInput1,
          output: currentOutput,
          // filterComments: currentFilterComments1,
          // inputComments: currentInputComments1,
          // outputComments: currentOutputComments,
        } = Generator.getParams(
          `IOutput\\w*\\s*`,
          { withoutComments: methodContent, withComments: file.withComments },
          true
        );
        const {
          filter: currentFilter2,
          input: currentInput2,
          // filterComments: currentFilterComments2,
          // inputComments: currentInputComments2,
        } = Generator.getParams(`IInput\\w*\\s*`, {
          withoutComments: methodContent,
          withComments: file.withComments,
        });
        const currentFilter = currentFilter1 || currentFilter2;
        const currentInput = currentInput1 || currentInput2;
        method.filter =
          currentFilter || (key !== 'create' ? filter : currentFilter);
        method.input =
          currentInput ||
          (key !== 'read' && key !== 'delete' ? input : currentInput);
        method.output = currentOutput || output;
        // method.filterComments =
        //   currentFilterComments1 || currentFilterComments2 || filterComments;
        // method.inputComments =
        //   currentInputComments1 || currentInputComments2 || inputComments;
        // method.outputComments = currentOutputComments || outputComments;
        // console.log('generateService2', method, currentFilter1, currentFilter2);
      }
    }
    // console.log('generateService3');
    return await Generator.generateModels(path, page);
  }

  static async getImportsFromPath(path?: string) {
    const content = await Generator.getFileString(path);
    // console.log('content', content);
    return {
      imports: Generator.getImports(content.withoutComments),
      ...content,
    };
  }

  static getImports(content: string) {
    const sRegex = 'import\\s*{*\\s*(.*?)\\s*}*\\s*from\\s*[\'"`](.*?)[\'"`];*';
    const regex = new RegExp(sRegex, 'gi');
    const matches: IterableIterator<RegExpMatchArray> | undefined =
      content.matchAll(regex) || undefined;

    const found: Array<{ elements: string[]; path: string }> = [];
    for (const match of matches) {
      const elements = match?.[1]
        ?.trim()
        .split(',')
        .map((e) => e.trim());
      const path = match?.[2]?.trim();
      found.push({ elements, path });
    }

    return found;
  }

  static async generateModels(
    path: string,
    page: {
      path: string;
      name: string;
      service?: string | undefined;
      methods?: { [name: string]: Record<string, unknown> } | undefined;
      baseInput?: string | undefined;
      baseOutput?: string | undefined;
    }
  ): Promise<{ path: string; name: string }> {
    // console.log('generateModels');
    // console.log('IMPORTS:', imports);
    // console.log('PAGE:', page);
    for (const key in page.methods) {
      if (Object.prototype.hasOwnProperty.call(page.methods, key)) {
        const method = page.methods[key];
        method.filter = await Generator.getProperty(
          method.filter as string,
          path,
          'filter'
        );
        method.input = await Generator.getProperty(
          method.input as string,
          path,
          'input'
        );
        method.output = await Generator.getProperty(
          method.output as string,
          path,
          'output'
        );
        // console.log('Method:', method);
      }
    }
    // console.log('generateModels end');
    return page;
  }

  static getInterfaces(sObject: string) {
    const sRegex =
      '(?:(?:type)|(?:interface)|(?:enum))\\s+(\\w+)\\s*=*\\s*(\\{(?:[^}{]+|\\{(?:[^}{]+|\\{[^}{]*\\})*\\})*\\})';
    const regex = new RegExp(sRegex, 'gi');
    const matches: IterableIterator<RegExpMatchArray> | undefined =
      sObject.matchAll(regex) || undefined;

    const found: Array<{ name?: string; content?: string }> = [];
    for (const match of matches) {
      const name = match?.[1].trim() !== '' ? match?.[1].trim() : undefined;
      const content = match?.[2].trim() !== '' ? match?.[2].trim() : undefined;
      found.push({ name, content });
    }

    return found;
  }

  static async getProperty(
    nameOrObjectString?: string,
    path?: string,
    name?: string
  ) {
    // TODO: Remover Optional e Array antes de pegar Object
    // console.log('getProperty:', nameOrObjectString, path);
    if (nameOrObjectString) {
      const isArrayA = Extractor.isArray(nameOrObjectString);
      const isArray = isArrayA && isArrayA.length;
      const baseType = (isArray && isArrayA[0]) || nameOrObjectString;
      let type = nameOrObjectString;
      // console.log('-----', type, '-----');
      let newNOString = nameOrObjectString
        .replaceAll(/./g, (a) => {
          if (
            a === 's' ||
            a === 'S' ||
            a === 'd' ||
            a === 'D' ||
            a === 'w' ||
            a === 'W' ||
            a === 'v' ||
            a === '#' ||
            a === 'p' ||
            a === 'P' ||
            a === 'n' ||
            a === 'r' ||
            a === 't' ||
            a === 'k' ||
            a === 'u' ||
            a === 'x' ||
            a === 'c' ||
            a === 'b' ||
            a === '0' ||
            a === '1' ||
            a === '2' ||
            a === '3' ||
            a === '4' ||
            a === '5' ||
            a === '6' ||
            a === '7' ||
            a === '8' ||
            a === '9' ||
            a === ' ' ||
            a === '\n' ||
            a === '\t'
          ) {
            return a;
          }
          return '\\' + a;
        })
        .replaceAll(/\n\s*\n/gm, '\\s+(\\/\\*(?:.|\\s)*?\\*\\/)*?\\s+')
        .replaceAll(/[\n\t\ ]+/gm, '\\s+')
        .replaceAll('\\s+\\s+', '\\s+')
        .replaceAll('\\s\\s+', '\\s+')
        .replaceAll('\\s+\\s', '\\s+');
      newNOString =
        (await Generator.getFileString(path)).withComments.match(
          newNOString
        )?.[0] || type;
      // console.log('getProperty nameOrObjectString:', newNOString, path);
      if (baseTypes.includes(baseType)) {
        // console.log('baseType array:', type, path, newNOString);
        return { array: type };
      } else {
        console.trace('getFullObject', type, path);
        type = await Generator.getObject(type, path, newNOString, name);
      }
      console.trace('RESULT:', type);
      // return isArray ? { array: type } : type;
      return type;
    }
  }

  static async addOption(
    rObject: { or?: any[]; and?: any[]; array?: any[] } | string,
    option: any,
    isAnd?: boolean
  ) {
    let object = rObject;
    if (isAnd) {
      if (typeof object !== 'string' && (object.and || object.or)) {
        object.and = object.and || [];
        object.and.push(option);
      } else {
        const old = object;
        object = { and: [old, option] };
      }
    } else {
      if (typeof object !== 'string' && (object.and || object.or)) {
        object.or = object.or || [];
        object.or.push(option);
      } else {
        const old = object;
        object = { or: [old, option] };
      }
    }
    object.or = [...new Set(object.or)];
    object.and = [...new Set(object.and)];
    if (object.or.length === 0) delete object.or;
    if (object.and.length === 0) delete object.and;
    return object;
  }

  static removeSpecialCharacters(rValue: any | string) {
    let value: any | string;
    try {
      value = JSON.parse(JSON.stringify(rValue));
    } catch (error) {
      value = rValue;
    }
    // console.log('removeSpecialCharacters B', value);
    if (typeof value === 'string') {
      value = value
        ?.replace('{@', '')
        ?.replace('}', '')
        // ?.replace('?', '')
        ?.trim();
    } else {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const newKey = Generator.removeSpecialCharacters(key);
          const newValue = Generator.removeSpecialCharacters(value[key]);
          if (newKey !== key) delete value[key];
          value[newKey] = newValue;
        }
      }
    }
    // console.log('removeSpecialCharacters A', value);
    return value;
  }

  static async getObject(
    nameOrObjectString?: string,
    path?: string,
    fileString?: string,
    name?: string
  ) {
    const file = await Generator.getImportsFromPath(path);
    // console.log('getObject nameOrObjectString:', nameOrObjectString, path);
    // console.log('IMPORTS:', imports);
    if (nameOrObjectString != undefined) {
      console.trace('bundler:', nameOrObjectString, name);
      let bundled = Generator.removeSpecialCharacters(
        Extractor.bundler(
          nameOrObjectString,
          Precedence.object,
          undefined,
          undefined,
          undefined,
          undefined,
          name?.replaceAll('{@', '')?.replaceAll('}', '')?.trim(),
          fileString
        )
      );
      console.trace(
        'bundler done:',
        nameOrObjectString,
        name,
        JSON.stringify(bundled, null, 5)
      );

      if (typeof bundled !== 'string') {
        for (const key in bundled) {
          if (Object.prototype.hasOwnProperty.call(bundled, key)) {
            if (key === '[object Object]') {
              console.log('KEY2:', key);
              delete bundled[key];
              continue;
            }
            // console.log('KEY:', key);
            let normalizedKey: any | string | undefined = key;

            const isOptional = (normalizedKey.value || normalizedKey)?.includes(
              '?'
            );
            normalizedKey = isOptional
              ? (normalizedKey.value || normalizedKey)?.replace('?', '')
              : normalizedKey.value || normalizedKey;

            if (isOptional) {
              bundled[normalizedKey] = bundled[key];
            }

            normalizedKey =
              normalizedKey && normalizedKey != 'undefined'
                ? normalizedKey
                : undefined;
            let normalizedValue: any =
              bundled[normalizedKey] && bundled[normalizedKey] != 'undefined'
                ? bundled[normalizedKey].value
                  ? bundled[normalizedKey].value
                  : bundled[normalizedKey]
                : undefined;
            const noProp = normalizedValue ? false : true;
            let descriptions =
              bundled[normalizedKey] &&
              bundled[normalizedKey] != 'undefined' &&
              bundled[normalizedKey]?.info
                ? bundled[normalizedKey]?.info
                    ?.filter(
                      (aInfo) =>
                        aInfo.ofs == undefined ||
                        aInfo.ofs.includes(
                          normalizedKey
                            ?.replaceAll('{@', '')
                            ?.replaceAll('}', '')
                            ?.replaceAll('?', '')
                            ?.trim()
                        ) ||
                        aInfo.ofs.length == 0
                    )
                    ?.map((aInfo) => aInfo.description)
                    ?.flat()
                    ?.filter((a) => a)
                : undefined;
            descriptions = descriptions?.length > 0 ? descriptions : undefined;
            const description =
              descriptions && descriptions.length > 0
                ? descriptions[0]
                : undefined;
            let examples =
              bundled[normalizedKey] &&
              bundled[normalizedKey] != 'undefined' &&
              bundled[normalizedKey]?.info
                ? bundled[normalizedKey]?.info
                    ?.filter(
                      (aInfo) =>
                        aInfo.ofs == undefined ||
                        aInfo.ofs.includes(
                          normalizedKey
                            ?.replaceAll('{@', '')
                            ?.replaceAll('}', '')
                            ?.replaceAll('?', '')
                            ?.trim()
                        ) ||
                        aInfo.ofs.length == 0
                    )
                    ?.map((aInfo) => aInfo.examples)
                    ?.flat()
                    ?.filter((a) => a)
                : undefined;
            examples = examples?.length > 0 ? examples : undefined;
            console.trace(
              'getObject:',
              normalizedKey,
              descriptions,
              examples,
              nameOrObjectString,
              name,
              JSON.stringify(bundled[normalizedKey], null, 5),
              JSON.stringify(bundled, null, 5)
            );
            // console.log(
            //   'getObject bundled[normalizedKey]:',
            //   JSON.stringify(bundled[normalizedKey], null, 5)
            // );
            // console.log(
            //   'getObject normalizedKey:',
            //   JSON.stringify(normalizedKey, null, 5)
            // );
            // console.log(
            //   'getObject normalizedValue:',
            //   JSON.stringify(normalizedValue, null, 5)
            // );
            // console.log(
            //   'getObject description:',
            //   JSON.stringify(description, null, 5)
            // );
            // console.log('getObject examples:', JSON.stringify(examples, null, 5));
            // console.log('NORM:', normalizedKey, normalizedValue);
            const newPath = await Generator.getImportPath(
              file.imports,
              normalizedValue || normalizedKey,
              path
            );

            // console.log(
            //   'NEW PATH:',
            //   normalizedKey,
            //   normalizedValue,
            //   newPath,
            //   path
            // );

            if (newPath !== path) {
              console.trace(
                'NEW PATH:',
                normalizedKey,
                normalizedValue,
                newPath,
                JSON.stringify(bundled, null, 5),
                key
              );
              normalizedValue = await Generator.getObjectString(
                normalizedValue || normalizedKey,
                newPath
              );
              normalizedValue = await Generator.getProperty(
                normalizedValue || normalizedKey,
                newPath,
                name
              );
            } else normalizedValue = normalizedValue || normalizedKey;

            // console.trace(
            //   'getObject pre bundled:',
            //   normalizedKey,
            //   normalizedValue,
            //   JSON.stringify(bundled, null, 5),
            //   nameOrObjectString,
            //   fileString
            // );

            if (!noProp && normalizedKey && normalizedValue) {
              if (typeof bundled === 'string') {
                // console.trace(
                //   'getObject bundled string:',
                //   normalizedKey,
                //   normalizedValue,
                //   bundled,
                //   nameOrObjectString,
                //   fileString
                // );

                bundled = {
                  value: bundled,
                };
              }

              if (
                normalizedKey !== 0 &&
                normalizedKey !== '0' &&
                normalizedValue !== 'n'
              ) {
                bundled[normalizedKey] = normalizedValue;

                if (isOptional)
                  bundled[normalizedKey] = await Generator.addOption(
                    bundled[normalizedKey],
                    'undefined'
                  );
                if (description || examples) {
                  bundled[normalizedKey] = {
                    value: bundled[normalizedKey],
                    description,
                    examples,
                  };
                }
                // console.log(
                //   'getObject pre bundled2:',
                //   JSON.stringify(bundled[normalizedKey], null, 5)
                // );
              }
            } else {
              let ret: any = normalizedValue;
              if (isOptional && normalizedValue)
                ret = await Generator.addOption(normalizedValue, 'undefined');
              if (description || examples) {
                ret = {
                  value: ret,
                  description,
                  examples,
                };
              }
              // console.log('getObject ret done:', JSON.stringify(ret, null, 5));
              return ret;
            }

            if (key !== normalizedKey) delete bundled[key];
          }
        }
        // console.log(
        //   'getObject bundled done:',
        //   JSON.stringify(bundled, null, 5)
        // );
      } else {
        console.trace(
          'getObject bundled else:',
          name,
          JSON.stringify(bundled, null, 5),
          nameOrObjectString,
          path
        );
      }
      return bundled;
    }
    return nameOrObjectString;
  }

  static async getFileString(path?: string) {
    const withComments = (await readFile(path || '', 'utf8')) || '';
    const withoutComments = Generator.removeComments(withComments) || '';
    return { withoutComments, withComments };
  }

  static async getImportPath(
    imports?: {
      elements: string[];
      path: string;
    }[],
    type?: string,
    path?: string
  ) {
    // console.log('IMPORTS:', imports, type, path);
    if (imports)
      for (const aImport of imports) {
        for (const element of aImport.elements) {
          if (type?.includes?.(element))
            return Generator.goToFile(aImport.path, path);
        }
      }
    return path;
  }

  static async getObjectString(element?: string, path?: string) {
    const file = await Generator.getFileString(path);
    const interfaces = Generator.getInterfaces(file.withoutComments || '');
    for (const aInterface of interfaces) {
      if (aInterface.name === element) {
        // console.log('found', aInterface.name, aInterface.content);
        return aInterface.content;
      }
    }
  }
}

export { Generator };
