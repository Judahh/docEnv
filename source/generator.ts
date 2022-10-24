import { readdir, readFile } from 'fs/promises';
import { BaseDocEntry, Doc, DocEntry, Id } from './doc';
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

const controllerMethods = {
  create: ['post'],
  read: ['get'],
  update: ['put', 'patch'],
  delete: ['delete'],
};

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

  public static async generateRoutes(path: string): Promise<Array<string>> {
    const paths: string[] = [];
    let files: string[] = [];

    try {
      files = await readdir(path, 'utf8');
    } catch (error) {}

    for (const file of files) {
      if (file.endsWith('.ts')) {
        paths.push(`${path}/${file}`);
      } else {
        const newPath = `${path}/${file}`;
        paths.push(...(await Generator.generateRoutes(newPath)));
      }
    }
    return paths;
  }

  public static async generatePages(source: string): Promise<string[]> {
    const paths: string[] = [];
    paths.push(...(await Generator.generateRoutes(`${source}/${'/pages'}`)));
    paths.push(...(await Generator.generateRoutes(`${source}/${'/api'}`)));
    return paths;
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

  static async getSpecificPaths(
    source: string,
    checkPaths?: string[]
  ): Promise<{ files: string[]; paths: string[] }> {
    const files: string[] = [];
    let paths: string[] = [];
    if (checkPaths) {
      for (const checkPath of checkPaths) {
        paths.push(
          ...(await Generator.generateRoutes(`${source}/${checkPath}`))
        );
      }
    }

    for (const path of paths) {
      if (path.includes('.ts')) {
        files.push(path);
        paths = paths.filter((p) => p !== path);
      }
    }
    return {
      files,
      paths,
    };
  }

  public static getFinalExpression(docs: DocEntry[], bodies: DocEntry[]) {
    const bodiesContent = docs?.filter((e) =>
      bodies.includes((e as BaseDocEntry).id)
    );

    const bodiesContentString = bodiesContent?.filter(
      (e) => (e as BaseDocEntry)?.kind == 'StringLiteral'
    );

    if (bodiesContentString?.length) {
      return bodiesContentString;
    }

    const argumentsFromBodiesContent = bodiesContent
      ?.map((e) =>
        (e as BaseDocEntry).code?.includes('request(')
          ? ((e as BaseDocEntry).arguments as BaseDocEntry[])?.map(
              (a) => (a && (a as BaseDocEntry)?.link) || a
            )
          : undefined
      )
      ?.flat();

    const statementsFromBodiesContent = bodiesContent
      ?.map((e) =>
        (
          ((e as BaseDocEntry).statements as BaseDocEntry[]) || [
            (e as BaseDocEntry).expression as BaseDocEntry,
          ]
        )?.map((a) => (a && (a as BaseDocEntry)?.link) || a)
      )
      ?.flat();

    if (docs?.length && statementsFromBodiesContent?.length) {
      const preArguments0 = this.getFinalExpression(
        docs,
        argumentsFromBodiesContent
      )?.filter((e) => e);

      const preStatements0 = this.getFinalExpression(
        docs,
        statementsFromBodiesContent
      )?.filter((e) => e);

      const _arguments =
        preArguments0?.filter(
          (e) => (e as BaseDocEntry)?.kind == 'StringLiteral'
        ) ||
        preStatements0?.filter(
          (e) => (e as BaseDocEntry)?.kind == 'StringLiteral'
        );

      if (_arguments?.length) return _arguments;

      const statements = preStatements0;

      if (statements?.length) return statements;
    }
    return bodiesContent;
  }

  public static getControllerExpression(docs: DocEntry[], current: DocEntry[]) {
    const extension = current?.map((e) => {
      const links = (e as BaseDocEntry)?.arguments
        ? ((e as BaseDocEntry)?.arguments as BaseDocEntry[])
            ?.map((a) => (a && (a as BaseDocEntry)?.link) || a)
            .filter((a) => a)
        : [((e as BaseDocEntry)?.expression as BaseDocEntry)?.link].filter(
            (a) => a
          );

      const next = docs.filter((p) =>
        links.includes((p as BaseDocEntry)?.id || (p as string))
      );

      // console.log('NEXT:', links, JSON.stringify(next, null, 5));

      return (e as BaseDocEntry)?.code?.includes('Mixin') ||
        ((e as BaseDocEntry)?.code?.includes('Controller') && next?.length)
        ? this.getControllerExpression(docs, next).flat()
        : e;
    });
    // console.log('GET EXTENSION:', JSON.stringify(extension, null, 5));
    return extension.flat();
  }

  public static async getMethodsFromControllers(
    docs: DocEntry[],
    controllers: DocEntry[]
  ) {
    // console.log('DOCS:', JSON.stringify(docs, null, 5), controllers);
    const extendsLinks = controllers
      .map((e) =>
        (e as BaseDocEntry).extends?.map((e) => (e as BaseDocEntry).link || e)
      )
      .flat();
    // console.log('EXTENDS LINKS:', extendsLinks);
    const _extends = docs?.filter((e) => {
      const id = (e as BaseDocEntry).id;
      const includes = extendsLinks.includes(id);
      // console.log('ID:', id, includes, extendsLinks);
      return includes;
    });
    const extension = this.getControllerExpression(docs, _extends).map((e) => ({
      name: (e as BaseDocEntry).code,
      id: (e as BaseDocEntry).id,
      type: (e as BaseDocEntry)?.code?.split('Controller')[1].toLowerCase(),
      methods:
        controllerMethods[
          (e as BaseDocEntry)?.code?.split('Controller')?.[1]?.toLowerCase() ||
            'read'
        ],
    }));
    // console.log('EXTENDS:', extension);
    // console.log('DOCS:', JSON.stringify(docs, null, 5));
    return extension;
  }

  public static async getControllerFromNames(
    docs: DocEntry[],
    names: string[]
  ) {
    const regNames = names.map((n) => `(?:${n})`).join('|');
    const regex = new RegExp(
      `this.controller\\!?\\??\\.?\\[?[\'\"\`]?${regNames}[\'\"\`]?\\]?`,
      'gm'
    );
    // console.log('DOCS:', JSON.stringify(docs, null, 5));
    const controllerAssignmentIds = docs
      ?.filter(
        (e) =>
          e &&
          (e as BaseDocEntry)?.code?.match(regex) &&
          (e as BaseDocEntry).kind === 'ExpressionStatement'
      )
      .map(
        (e) =>
          ((e as BaseDocEntry).expression as BaseDocEntry).link ||
          ((e as BaseDocEntry).expression as BaseDocEntry)
      );

    const controllerAssignmentInputIds = docs
      ?.filter((e) =>
        controllerAssignmentIds.includes(
          (e as BaseDocEntry).id || (e as BaseDocEntry)
        )
      )
      .map(
        (e) =>
          ((e as BaseDocEntry).right as BaseDocEntry).link ||
          ((e as BaseDocEntry).right as BaseDocEntry)
      );

    const controllerAssignmentInputExpressionIds = docs
      ?.filter((e) =>
        controllerAssignmentInputIds.includes(
          (e as BaseDocEntry).id || (e as BaseDocEntry)
        )
      )
      .map(
        (e) =>
          ((e as BaseDocEntry).expression as BaseDocEntry).link ||
          ((e as BaseDocEntry).expression as BaseDocEntry)
      );

    const controllerName = docs
      ?.filter((e) =>
        controllerAssignmentInputExpressionIds.includes(
          (e as BaseDocEntry).id || (e as BaseDocEntry)
        )
      )
      .map(
        (c) =>
          (c as BaseDocEntry).name ||
          (c as BaseDocEntry).code ||
          (c as BaseDocEntry)
      );

    const controller = docs?.filter(
      (e) =>
        controllerName.includes(
          (e as BaseDocEntry).name || (e as BaseDocEntry)
        ) && (e as BaseDocEntry).kind === 'ClassDeclaration'
    );

    return controller;
  }

  public static getHandlerExpression(docs: DocEntry[], current: DocEntry[]) {
    const extension = current?.map((e) => {
      const links = (e as BaseDocEntry)?.properties
        ? ((e as BaseDocEntry)?.properties as BaseDocEntry[])
            ?.map((a) => (a && (a as BaseDocEntry)?.link) || a)
            .filter((a) => a)
        : (e as BaseDocEntry)?.arguments
        ? ((e as BaseDocEntry)?.arguments as BaseDocEntry[])
            ?.map((a) => (a && (a as BaseDocEntry)?.link) || a)
            .filter((a) => a)
        : [((e as BaseDocEntry)?.expression as BaseDocEntry)?.link].filter(
            (a) => a
          );

      const next = docs.filter((p) =>
        links.includes((p as BaseDocEntry)?.id || (p as string))
      );

      // console.log('NEXT:', links, JSON.stringify(next, null, 5));

      return next?.length ? this.getHandlerExpression(docs, next).flat() : e;
    });
    // console.log('GET EXTENSION:', JSON.stringify(extension, null, 5));
    return extension.flat();
  }

  public static getHandlersFlow(docs: DocEntry[], current: DocEntry[]) {
    // console.log('CURRENT:', JSON.stringify(current, null, 5));
    const initializer = docs.filter((d) =>
      current
        .map((e) => ((e as BaseDocEntry)?.initializer as BaseDocEntry)?.link)
        ?.includes((d as BaseDocEntry)?.id || (d as unknown as Id))
    );

    // console.log('INIT:', JSON.stringify(initializer, null, 5));

    const flow = docs.filter((d) =>
      initializer
        .map((e) => ((e as BaseDocEntry)?.flow as BaseDocEntry)?.link)
        ?.includes((d as BaseDocEntry)?.id || (d as unknown as Id))
    );

    // console.log('FLOW:', JSON.stringify(flow, null, 5));
    if (!flow?.length) {
      return initializer;
    }

    const next = flow
      .map((d) =>
        ((d as BaseDocEntry)?.initializer as BaseDocEntry) ? d : undefined
      )
      .filter((d) => d)
      .flat();

    if (next?.length) {
      // console.log('NEXT:', JSON.stringify(next, null, 5));
      return this.getHandlersFlow(docs, next);
    }

    if (flow?.length) {
      // console.log('FLOW:', JSON.stringify(flow, null, 5));
      return flow;
    }

    return current;
  }

  public static async getHandlers(docs: DocEntry[]) {
    const _exports = docs?.filter((e) =>
      ((e as BaseDocEntry)?.kind as string)?.includes('ExportAssignment')
    );
    const expression = this.getHandlerExpression(docs, _exports).filter(
      (a) => a.name === 'handler'
    );
    const initializer = this.getHandlersFlow(docs, expression);

    // console.log('INIT:', JSON.stringify(initializer, null, 5));

    const read = docs.filter((d) =>
      initializer
        .map((a) => a.arguments[1].link || a.arguments[1])
        .includes((d as BaseDocEntry)?.id || (d as unknown as Id))
    );

    // console.log('READ:', JSON.stringify(read, null, 5));

    const readInitializerIds = docs
      .filter((d) =>
        read
          .map(
            (a) =>
              (a as BaseDocEntry)?.declarations?.map(
                (b) => (b as BaseDocEntry).link || b
              ) || a
          )
          .flat()
          .filter((a) => a)
          .includes((d as BaseDocEntry)?.id || (d as unknown as Id))
      )
      .map(
        (a) =>
          (
            ((a as BaseDocEntry)?.initializer as BaseDocEntry)
              ?.link as BaseDocEntry
          )?.id ||
          ((a as BaseDocEntry)?.initializer as BaseDocEntry)?.link ||
          (a as BaseDocEntry)?.initializer
      );

    const readExpressionIds = docs
      .filter((d) =>
        readInitializerIds.includes(
          (d as BaseDocEntry)?.id || (d as unknown as Id)
        )
      )
      .map(
        (a) =>
          (
            ((a as BaseDocEntry)?.expression as BaseDocEntry)
              ?.link as BaseDocEntry
          )?.id ||
          ((a as BaseDocEntry)?.expression as BaseDocEntry)?.link ||
          (a as BaseDocEntry)?.expression
      );

    const readExpression = docs
      .filter((d) =>
        readExpressionIds.includes(
          (d as BaseDocEntry)?.id || (d as unknown as Id)
        )
      )
      .map((a) => {
        const name =
          (a as BaseDocEntry).name || (a as BaseDocEntry).code || (a as string);
        let type = name?.toLowerCase();
        type = type?.includes('dao')
          ? 'dAOs'
          : type?.includes('persistence')
          ? 'schemas'
          : 'services';
        const suffix =
          type === 'dAOs' ? 'DAO' : type === 'schemas' ? 'Schema' : 'Service';
        return {
          name,
          type,
          suffix,
        };
      });

    return readExpression;
  }

  public static async getControllerNames(docs: DocEntry[]) {
    const finalExported = docs.filter(
      (p) =>
        (p as BaseDocEntry).kind === 'ExportAssignment' &&
        (p as BaseDocEntry).code?.includes('(...') &&
        (p as BaseDocEntry).code?.includes('request(')
    );
    // console.log('finalExported', JSON.stringify(finalExported, null, 5));
    const names: string[] = [];
    for (const exp of finalExported) {
      const expressionLink =
        ((exp as BaseDocEntry)?.expression as BaseDocEntry)?.link ||
        (exp as BaseDocEntry).expression;
      const expressionBody = docs
        .filter((e) => (e as BaseDocEntry).id === expressionLink)
        .map(
          (e) =>
            ((e as BaseDocEntry).body as BaseDocEntry)?.link ||
            (e as BaseDocEntry).body
        );
      const ex = this.getFinalExpression(docs, expressionBody)
        .map((e) => (e as BaseDocEntry)?.code?.replace(/['"]/g, ''))
        .filter((e) => e);

      names.push(...ex);
    }
    return names;
  }

  public static async getPaths(sourcePath: string): Promise<{
    pages: string[];
    routes: string[];
    services: string[];
    schemas: string[];
    dAOs: string[];
    controllers: string[];
    models: string[];
    configs: string[];
    handlers: string[];
    paths: string[];
  }> {
    const pages = await Generator.getSpecificPaths(sourcePath, [
      'page',
      'pages',
      'api',
    ]);
    const routes = await Generator.getSpecificPaths(sourcePath, [
      'route',
      'routes',
    ]);
    const services = await Generator.getSpecificPaths(sourcePath, [
      'service',
      'services',
    ]);

    const schemas = await Generator.getSpecificPaths(sourcePath, [
      'schema',
      'schemas',
      'database',
      'databases',
    ]);

    const dAOs = await Generator.getSpecificPaths(sourcePath, [
      'dAO',
      'dAOs',
      'dao',
      'daos',
    ]);

    const controllers = await Generator.getSpecificPaths(sourcePath, [
      'controller',
      'controllers',
    ]);

    const models = await Generator.getSpecificPaths(sourcePath, [
      'model',
      'models',
    ]);

    const configs = await Generator.getSpecificPaths(sourcePath, [
      'config',
      'configs',
    ]);

    let baseFiles: string[] = [];
    try {
      baseFiles = (await readdir(sourcePath, 'utf8')).map(
        (e) => `${sourcePath}/${e}`
      );
    } catch (error) {}
    const handlers = [
      ...(
        await Generator.getSpecificPaths(sourcePath, [
          'dbHandler',
          'dBHandler',
          'DBHandler',
          'databaseHandler',
          'dbHandlers',
          'dBHandlers',
          'DBHandlers',
          'databaseHandlers',
          'handler',
          'handlers',
        ])
      ).files,
      ...baseFiles.filter(
        (f) => f.includes('Handler') || f.includes('handler')
      ),
    ];
    return {
      pages: pages.files,
      routes: routes.files,
      services: services.files,
      schemas: schemas.files,
      dAOs: dAOs.files,
      controllers: controllers.files,
      models: models.files,
      configs: configs.files,
      handlers: handlers,
      paths: [...pages.paths, ...routes.paths, ...services.paths],
    };
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
        // console.trace('getFullObject', type, path);
        type = await Generator.getObject(type, path, newNOString, name);
      }
      // console.trace('RESULT:', type);
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
      // console.trace('bundler:', nameOrObjectString, name);
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
      // console.trace(
      //   'bundler done:',
      //   nameOrObjectString,
      //   name,
      //   JSON.stringify(bundled, null, 5)
      // );

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
            // console.trace(
            //   'getObject:',
            //   normalizedKey,
            //   descriptions,
            //   examples,
            //   nameOrObjectString,
            //   name,
            //   JSON.stringify(bundled[normalizedKey], null, 5),
            //   JSON.stringify(bundled, null, 5)
            // );
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
              // console.trace(
              //   'NEW PATH:',
              //   normalizedKey,
              //   normalizedValue,
              //   newPath,
              //   JSON.stringify(bundled, null, 5),
              //   key
              // );
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
        // console.trace(
        //   'getObject bundled else:',
        //   name,
        //   JSON.stringify(bundled, null, 5),
        //   nameOrObjectString,
        //   path
        // );
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
