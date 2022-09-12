import { readdir, readFile } from 'fs/promises';

class Generator {
  public static removeComments(content: string) {
    return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
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
    let content = await readFile(path, 'utf8');
    content = Generator.removeComments(content);
    if (content.includes('request('))
      return await Generator.generateRouteElement(
        '(' + content.split('request(')[1].split(';')[0],
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
      let content = Generator.removeComments(await readFile(path, 'utf8'))
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
    const route = Generator.removeComments(await readFile(routePath, 'utf8'));
    route.replace(
      /\.controller\.(\w+)\s*=\s*(?:new)*\s*(.+?)\(\w*\);/gm,
      (a, group1, group2) => {
        `{group1: ${group1}, group2: ${group2}}`;
        pages[group1.trim()]['controller'] = group2;
        const sRegex = `import\\s*\\{*\\s${group2}\\s*\\}*\\sfrom*\\s(.*?);`;
        const regex = new RegExp(sRegex);
        const match: RegExpMatchArray | undefined =
          route.match(regex) || undefined;
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

  static getParams(prefix: string, content: string, isTriple = false) {
    const groupObject = '\\s*?((?:.|\\s)*?)\\s*?';
    const groups = isTriple
      ? `<${groupObject}(?:,${groupObject}){0,1}(?:,${groupObject}){0,1}>`
      : `<${groupObject}(?:,${groupObject}){0,1}>`;
    const sRegex = `\\s*${prefix}\\s*${groups}`;
    const regex = new RegExp(sRegex, 'i');
    const match: RegExpMatchArray | undefined =
      content.match(regex) || undefined;

    const filter = match?.[1]?.trim();
    const input = match?.[2]?.trim();
    const output = match?.[3]?.trim();
    return { filter, input, output };
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
    const baseContent = await readFile(path, 'utf8');
    const content = Generator.removeComments(baseContent);
    const { filter, input, output } = Generator.getParams(
      `${page.service}\\s*extends\\s*BaseService`,
      content,
      true
    );

    for (const key in page.methods) {
      if (Object.prototype.hasOwnProperty.call(page.methods, key)) {
        const method = page.methods[key];
        const {
          filter: currentFilter1,
          input: currentInput1,
          output: currentOutput,
        } = Generator.getParams(
          `${key}\\s*\\(\\s*input\\s*:\\s*IInput${key}\\s*<\\s*?(?:(?:.|\\s)*?)\\s*?(?:,\\s*?(?:(?:.|\\s)*?)\\s*?)*>\\s*\\)\\s*:\\s*(?:Promise\\s*<\\s*)*IOutput`,
          content,
          true
        );
        const { filter: currentFilter2, input: currentInput2 } =
          Generator.getParams(
            `${key}\\s*\\(\\s*input\\s*:\\s*IInput${key}`,
            content
          );
        const currentFilter = currentFilter1 || currentFilter2;
        const currentInput = currentInput1 || currentInput2;
        method.filter =
          currentFilter || (key !== 'create' ? filter : currentFilter);
        method.input =
          currentInput ||
          (key !== 'read' && key !== 'delete' ? input : currentInput);
        method.output = currentOutput || output;
      }
    }

    return await Generator.generateModels(path, page, baseContent);
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
    },
    rBaseContent: string
  ): Promise<{ path: string; name: string }> {
    const baseContent = rBaseContent;
    const content = Generator.removeComments(baseContent);
    // TODO: find models files
    return page;
  }
}

export { Generator };
