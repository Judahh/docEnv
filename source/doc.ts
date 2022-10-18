// import _ from 'lodash'; //use _.isEqual(objectOne, objectTwo); // to compare objects
import { isArray } from 'lodash';
import { mongo, ObjectId } from 'mongoose';

import ts, {
  Node,
  SyntaxKind,
  TypeChecker,
  CompilerOptions,
  createCompilerHost,
  createProgram,
  forEachChild,
  findConfigFile,
  readConfigFile,
  parseJsonConfigFileContent,
  sys,
  Declaration,
  displayPartsToString,
  getCombinedModifierFlags,
  ModifierFlags,
  createSourceFile,
  ScriptTarget,
  getModifiers,
  canHaveModifiers,
} from 'typescript';

export enum Operation {
  // eslint-disable-next-line no-unused-vars
  or = 0,
  // eslint-disable-next-line no-unused-vars
  and,
  // eslint-disable-next-line no-unused-vars
  add,
  // eslint-disable-next-line no-unused-vars
  sub,
  // eslint-disable-next-line no-unused-vars
  mul,
  // eslint-disable-next-line no-unused-vars
  div,
  // eslint-disable-next-line no-unused-vars
  mod,
  // eslint-disable-next-line no-unused-vars
  eq,
  // eslint-disable-next-line no-unused-vars
  neq,
  // eslint-disable-next-line no-unused-vars
  lt,
  // eslint-disable-next-line no-unused-vars
  lte,
  // eslint-disable-next-line no-unused-vars
  gt,
  // eslint-disable-next-line no-unused-vars
  gte,
  // eslint-disable-next-line no-unused-vars
  not,
  // eslint-disable-next-line no-unused-vars
  neg,
  // eslint-disable-next-line no-unused-vars
  pos,
  // eslint-disable-next-line no-unused-vars
  in,
  // eslint-disable-next-line no-unused-vars
  nin,
}

const operatorToOperation = {
  50: Operation.and,
  51: Operation.or,
  55: Operation.and,
  56: Operation.or,
};

type Id = ObjectId | string | number;

interface BaseDocEntry {
  modifiers?: DocEntry[];
  link?: Id;
  linked?: Id[];
  id?: Id;
  name?: string;
  internal?: boolean;
  escapedName?: string;
  text?: string;
  code?: string;
  body?: DocEntry;
  expression?: DocEntry;
  initializer?: DocEntry;
  declaration?: DocEntry;
  operator?: string;
  operation?: Operation;
  operationName?: string;
  left?: DocEntry;
  right?: DocEntry;
  arguments?: DocEntry[];
  statements?: DocEntry[];
  fileName?: string;
  documentation?: DocEntry;
  flags?: string;
  type?: DocEntry;
  typeName?: string;
  kind?: DocEntry;
  types?: DocEntry[];
  signatures?: DocEntry[];
  implements?: DocEntry[];
  extends?: DocEntry[];
  parameters?: DocEntry[];
  members?: DocEntry[];
  returnType?: DocEntry;
}

type DocEntry = BaseDocEntry | string | Id | undefined;

export const caller = async <T>(
  // eslint-disable-next-line no-unused-vars
  toCall: (...args) => unknown,
  self,
  ...args
) => {
  return new Promise<T>((resolve) => {
    setTimeout(async () => {
      const result = await toCall.bind(self)(...args);
      resolve(result as T);
    }, 0);
  });
};

function pushIfNotExists<T>(array: T[], item: T) {
  if (!array.includes(item)) array.push(item);
}

function isObjectId(value: DocEntry): value is ObjectId {
  if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
    return true;
  }
  return value instanceof mongo.ObjectId;
}

function newId(): Id {
  return new mongo.ObjectId().toString() as Id;
}

function isId(value: DocEntry | ObjectId): value is Id {
  return typeof value === 'number' || isObjectId(value);
}

class Doc {
  protected baseTypes = [
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
  protected checker?: TypeChecker;
  protected options?: CompilerOptions;
  /** Generate documentation for all classes in a set of .ts files */
  async generateDocumentation(
    override?: {
      compilerOptions?: CompilerOptions;
      include?: string[];
      exclude?: string[];
      files?: string[];
      extends?: string;
      filenames?: string[];
    },
    currentDir?: string
  ): Promise<DocEntry[]> {
    const { options, fileNames, rootDir } = this.getOptions(
      override,
      currentDir
    );
    const host = createCompilerHost(options);
    // Build a program using the set of root file names in fileNames
    const program = createProgram(fileNames, options, host);

    // Get the checker, we will use it to find more about classes
    this.checker = program.getTypeChecker();
    const output: DocEntry[] = [];

    const visit = (node: Node) => this.visit(node, output, rootDir);

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        // Walk the tree to search for classes
        forEachChild(sourceFile, visit.bind(this));
      }
    }

    return output;
  }

  getOptions(
    override: {
      compilerOptions?: CompilerOptions;
      include?: string[];
      exclude?: string[];
      files?: string[];
      extends?: string;
      filenames?: string[];
    } = {},
    currentDir = '.'
  ) {
    const configFile = findConfigFile(
      currentDir,
      sys.fileExists,
      'tsconfig.json'
    );
    if (!configFile) throw Error('tsconfig.json not found');
    const { config } = readConfigFile(configFile, sys.readFile);

    config.compilerOptions = Object.assign(
      {},
      config.compilerOptions,
      override.compilerOptions
    );
    if (override.include) config.include = override.include;
    if (override.exclude) config.exclude = override.exclude;
    if (override.files) config.files = override.files;
    if (override.extends) config.files = override.extends;

    const fileContent = parseJsonConfigFileContent(config, sys, currentDir);

    if (override.filenames) fileContent.fileNames = override.filenames;

    this.options = fileContent.options;
    return {
      options: fileContent.options,
      fileNames: fileContent.fileNames,
      rootDir: currentDir,
      errors: fileContent.errors,
    };
  }

  isNodeExported(node: Node): boolean {
    return (
      (getCombinedModifierFlags(node as Declaration) & ModifierFlags.Export) !==
        0 ||
      (!!node?.parent && node?.parent?.kind === SyntaxKind.SourceFile)
    );
  }

  /** visit nodes finding exported classes */
  visit(node: Node, output?: Array<DocEntry>, rootDir?: string): void {
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      // console.log('not exported', SyntaxKind[node.kind]);
      return;
    }

    const newNode = this.serializeNode(node, output);

    output?.push(newNode);
    forEachChild(node, (node) => this.visit.bind(this)(node, output, rootDir));
  }

  cleanUp(doc: DocEntry) {
    if (typeof doc === 'string' || typeof doc === 'number' || isObjectId(doc))
      return doc;
    if (doc) {
      if (!doc?.documentation) delete doc.documentation;
      if (!doc?.signatures?.length) delete doc.signatures;
      if (doc?.id == undefined) delete doc.id;
      if (!doc?.name) delete doc.name;
      if (!doc?.code || doc.code.trim() === '') delete doc.code;
      if (!doc?.body) delete doc.body;
      if (!doc?.typeName) delete doc.typeName;
      if (!doc?.operationName) delete doc.operationName;
      if (!doc?.expression) delete doc.expression;
      if (!doc?.arguments?.length) delete doc.arguments;
      if (!doc?.parameters?.length) delete doc.parameters;
      if (!doc?.statements?.length) delete doc.statements;
      if (!doc?.modifiers?.length) delete doc.modifiers;
      if (!doc?.initializer) delete doc.initializer;
      if (!doc?.declaration) delete doc.declaration;
      if (!doc?.operator) {
        delete doc.operator;
        delete doc.operation;
      }
      if (!doc?.left) delete doc.left;
      if (!doc?.right) delete doc.right;
      if (!doc?.escapedName || doc?.escapedName == 'default')
        delete doc.escapedName;
      if (!doc?.types?.length) delete doc?.types;
      if (!doc?.type) delete doc?.type;
      if (!doc?.members?.length) delete doc?.members;
      if (!doc?.extends?.length) delete doc?.extends;
      if (
        !doc?.types ||
        !doc?.types?.length ||
        (doc?.types?.length === 1 &&
          ((typeof doc?.types?.[0] != 'string' &&
            typeof doc?.types?.[0] != 'number' &&
            !isObjectId(doc?.types?.[0]) &&
            doc?.types?.[0]?.name === 'error') ||
            doc?.types?.[0] === 'error'))
      )
        delete doc?.types;

      if (Object.getOwnPropertyNames(doc).length === 1 && doc?.name)
        return doc?.name;
    }
    return doc;
  }

  serializeNode(node?: Node, base?: DocEntry[]): DocEntry {
    if (node == undefined) return undefined;

    const tempKind = (node as unknown as { type: Node })?.type?.kind;

    let type = tempKind !== undefined ? SyntaxKind[tempKind] : undefined;
    const fullTypeName = this.checker?.getTypeAtLocation(
      (node as unknown as { name: Node }).name
    );
    const typeName = fullTypeName
      ? this?.checker?.typeToString(fullTypeName, node)
      : undefined;

    if (typeName?.includes('=>') && type == undefined) {
      const sourceFile = createSourceFile(
        'temp',
        `type temp = ${typeName}`,
        this.options?.target || ScriptTarget.ES2015,
        true
      );

      type =
        SyntaxKind[
          (sourceFile?.statements?.[0] as unknown as { type: { type: Node } })
            ?.type?.type?.kind
        ];
    }

    let id: Id | undefined;
    try {
      id = (this.checker?.getSymbolAtLocation?.(node) as unknown as { id: Id })
        ?.id;
    } catch (error) {
      id = (node as unknown as { id: Id })?.id;
    }

    let name: string | undefined = (
      node as unknown as { name: { escapedText: string } }
    )?.name?.escapedText?.toString();

    const code = node?.getText();
    const operatorValue = (node as unknown as { operatorToken: Node })
      ?.operatorToken?.kind;
    const operator = SyntaxKind[operatorValue];
    const operation = operatorToOperation[operatorValue];
    const operationName = Operation[operation];

    const modifiers = canHaveModifiers(node)
      ? getModifiers(node)?.map((modifier) => {
          return SyntaxKind[modifier.kind];
        })
      : undefined;

    const documentation =
      this.serializeDocumentation.bind(this)(node) ||
      this.serializeDocumentation.bind(this)(
        (node as unknown as { name: Node })?.name
      );

    const declaration = this.serializeNode.bind(this)(
      (node as unknown as { declarationList: { declarations: Node[] } })
        ?.declarationList?.declarations?.[0],
      base
    );

    if (name == undefined && typeof declaration == 'object') {
      name = (declaration as BaseDocEntry)?.name;
    }

    const initializer = this.serializeNode.bind(this)(
      (node as unknown as { initializer: Node })?.initializer,
      base
    );

    const left = this.serializeNode.bind(this)(
      (node as unknown as { left: Node })?.left,
      base
    );

    const right = this.serializeNode.bind(this)(
      (node as unknown as { right: Node })?.right,
      base
    );

    const body = this.serializeNode.bind(this)(
      (node as unknown as { body: Node })?.body,
      base
    );

    const expression = this.serializeNode.bind(this)(
      (node as unknown as { expression: Node })?.expression,
      base
    );

    const _extends = (
      node as unknown as { heritageClauses: { types: Node[] }[] }
    )?.heritageClauses?.map((clause) => {
      return clause.types.map((type: Node | undefined) => {
        return this.serializeNode.bind(this)(type, base);
      });
    });

    const members: DocEntry[] = (
      node as unknown as { members: Node[] }
    )?.members?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base)
    );

    const parameters: DocEntry[] = (
      node as unknown as { parameters: Node[] }
    )?.parameters?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base)
    );

    const statements: DocEntry[] = (
      node as unknown as { statements: Node[] }
    )?.statements?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base)
    );

    const _arguments = (
      node as unknown as { arguments: Node[] }
    )?.arguments?.map((argument: Node | undefined) => {
      return this.serializeNode.bind(this)(argument, base);
    });

    let entry: DocEntry = {
      id: id != undefined ? id : newId(),
      name,
      code,
      body,
      type,
      typeName,
      initializer,
      declaration,
      operator,
      operation,
      operationName,
      left,
      right,
      expression,
      arguments: _arguments,
      parameters,
      statements,
      modifiers,
      kind: SyntaxKind[node.kind],
      documentation,
      members,
      extends: _extends?.flat(),
    };

    // console.log('entry is', JSON.stringify(entry, null, 5));

    entry = this.refactorDocumentations.bind(this)(entry) as BaseDocEntry;

    entry.declaration = this.linkObject.bind(this)(entry, base, 'declaration');
    entry.initializer = this.linkObject.bind(this)(entry, base, 'initializer');
    entry.left = this.linkObject.bind(this)(entry, base, 'left');
    entry.right = this.linkObject.bind(this)(entry, base, 'right');
    entry.body = this.linkObject.bind(this)(entry, base, 'body');
    entry.expression = this.linkObject.bind(this)(entry, base, 'expression');

    entry.extends = this.linkArray.bind(this)(entry, base, 'extends');
    entry.members = this.linkArray.bind(this)(entry, base, 'members');
    entry.parameters = this.linkArray.bind(this)(entry, base, 'parameters');
    entry.statements = this.linkArray.bind(this)(entry, base, 'statements');
    entry.arguments = this.linkArray.bind(this)(entry, base, 'arguments');

    const cleaned = this.cleanUp(entry);

    // console.log(
    //   'cleaned is',
    //   JSON.stringify(cleaned, null, 5),
    //   JSON.stringify(entry, null, 5)
    // );

    return cleaned;
  }

  serializeDocumentation(node?: Node) {
    if (node == undefined) return undefined;
    let symbol: ts.Symbol | undefined;
    try {
      symbol = this.checker?.getSymbolAtLocation?.(node);
    } catch (error) {
      symbol = node as unknown as ts.Symbol;
    }
    const comments =
      symbol?.getDocumentationComment?.(this.checker) ||
      (node as unknown as { jsDoc: any })?.jsDoc?.map((doc: any) => ({
        kind: 'text',
        text: doc?.comment,
      }));
    const text = displayPartsToString(comments);
    const documentation = {
      text,
    };

    const tags =
      symbol?.getJsDocTags?.() ||
      (node as unknown as { jsDoc: any })?.jsDoc
        ?.map((doc: any) => doc.tags)
        ?.flat();
    if (tags)
      for (const tag of tags) {
        // console.log('tag is', tag);
        const name = tag?.name
          ? tag.name === 'param'
            ? 'parameters'
            : tag.name
          : tag?.tagName?.escapedText;
        if (name) {
          if (documentation[name] === undefined) documentation[name] = [];
          const text = tag.text || tag.comment;
          if (text)
            if (name === 'parameters') {
              const parameterName = text.filter(
                (p: { kind: string }) => p.kind === 'parameterName'
              )[0].text;
              const parameterText = text
                .filter((p: { kind: string }) => p.kind === 'text')
                .map((p: { text: string }) => p.text.trim())
                .filter((p: string) => p && p !== '')
                .join(' ');
              const doc: DocEntry = {
                name: parameterName,
                text: parameterText,
              } as unknown as BaseDocEntry;
              if (doc?.text?.[0] === '-') doc.text = doc.text.slice(1).trim();
              if (!doc.text) documentation[name].push(parameterName);
              else documentation[name].push(doc);
            } else
              documentation[name].push(
                ...(Array.isArray(text)
                  ? text.map((x: { text: any }) => x.text)
                  : [text])
              );
          else documentation[name].push(true);
        }
      }
    if (!tags || (!tags.length && !text)) return undefined;
    return documentation;
  }

  toObject(object?: DocEntry) {
    if (isId(object)) object = { id: object };
    else if (typeof object === 'string') object = { name: object };
    return object as BaseDocEntry;
  }

  linkArray(parent: DocEntry, base?: DocEntry[], index?: number | string) {
    if (base == undefined || index == undefined) return undefined;
    if (parent?.[index] && Array.isArray(parent?.[index])) {
      const array = parent[index].map((_child, index2) => {
        const object = this.linkObject(parent, base, index, index2);
        return object;
      });
      return array;
    }
    return parent?.[index];
  }

  linkObject(
    parent: DocEntry,
    base?: DocEntry[],
    index?: number | string,
    index2?: number | string
  ) {
    if (
      base == undefined ||
      index == undefined ||
      parent == undefined ||
      parent[index] == undefined
    )
      return undefined;
    parent = this.toObject(parent);
    let p = parent[index];
    p = index2 != undefined ? p[index2] : p;
    let newObject = this.toObject(JSON.parse(JSON.stringify(p)));
    const foundIndex = base?.findIndex((x) => {
      const nX = this.toObject(JSON.parse(JSON.stringify(x)));
      return nX?.id === newObject?.id;
    });
    if (foundIndex !== undefined && foundIndex !== -1) {
      base[foundIndex] = this.toObject(
        JSON.parse(JSON.stringify(base?.[foundIndex]))
      );
      newObject = base[foundIndex] as BaseDocEntry;
      if (newObject) {
        newObject.linked = newObject.linked ? newObject.linked : [];
        pushIfNotExists(newObject.linked, parent?.id);
      }
    } else if (newObject) {
      newObject.linked = newObject.linked ? newObject.linked : [];
      pushIfNotExists(newObject.linked, parent?.id);
    }
    pushIfNotExists(base, newObject);
    if (index2 != undefined) {
      parent[index][index2] = {
        link: isId(newObject) ? newObject : newObject?.id,
      };
      return parent[index][index2] as BaseDocEntry;
    } else {
      parent[index] = { link: isId(newObject) ? newObject : newObject?.id };
      return parent[index] as BaseDocEntry;
    }
  }

  linkAnObject(newObject?: DocEntry, parent?: DocEntry) {
    const currentObject: BaseDocEntry = {
      link: isId(newObject) ? newObject : newObject?.id,
    };
    if (newObject) {
      newObject = this.toObject(newObject);
      newObject.linked = newObject.linked ? newObject.linked : [];
      if (parent) {
        parent = this.toObject(parent);
        pushIfNotExists(newObject.linked, parent?.id);
      }
    }
    return currentObject;
  }

  refactorObject(
    object: DocEntry,
    base?: DocEntry[],
    parent?: DocEntry,
    level = 0
  ): DocEntry {
    if (object) {
      if (level > 0 && parent) {
        // find object in base
        const found = base?.find((b) => {
          object = this.toObject(object);
          b = this.toObject(b);
          if (b && b.id == undefined) b.id = newId();
          if (object && object.id == undefined) object.id = newId();

          return b?.id === object?.id;
        });
        if (found) {
          object = this.linkAnObject(found, parent);
        } else {
          object = this.toObject(object);
          for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
              if (Array.isArray(object[key]) && object[key].length > 0)
                this.refactorObjects.bind(this)(
                  object[key],
                  base,
                  object,
                  level + 1
                );
              else if (typeof object[key] === 'object')
                object[key] = this.refactorObject.bind(this)(
                  object[key],
                  base,
                  object,
                  level + 1
                );
            }
          }

          const newObject = JSON.parse(JSON.stringify(object)) as BaseDocEntry;
          newObject.internal = true;
          object = this.linkAnObject(newObject, parent);
          base?.push(newObject);
        }
      } else if (level > 0) {
        object = this.toObject(object);
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            if (Array.isArray(object[key]))
              this.refactorObjects.bind(this)(
                object[key],
                base,
                parent,
                level + 1
              );
            else if (typeof object[key] === 'object')
              object[key] = this.refactorObject.bind(this)(
                object[key],
                base,
                object,
                level + 1
              );
          }
        }
      }
    }
    return object;
  }

  refactorObjects(
    current?: DocEntry | DocEntry[],
    base?: DocEntry[],
    parent?: DocEntry,
    level = 0
  ): void {
    if (!base) base = Array.isArray(current) ? current : [current];
    if (Array.isArray(current)) {
      for (let index = 0; index < current.length; index++) {
        current[index] = this.toObject(current[index]);
        for (const key in current[index] as BaseDocEntry) {
          if (
            Object.prototype.hasOwnProperty.call(current[index], key) &&
            key !== 'linked' &&
            current?.[index]?.[key]
          ) {
            if (Array.isArray(current[index]?.[key])) {
              this.refactorObjects.bind(this)(
                current?.[index]?.[key],
                base,
                current?.[index],
                level + 1
              );
            } else if (typeof current[index]?.[key] === 'object') {
              current[index] = this.refactorObject.bind(this)(
                current[index],
                base,
                parent,
                level + 1
              );
            }
          }
        }
      }
    } else {
      console.log('current is not array');
      current = this.refactorObject.bind(this)(
        current,
        base as DocEntry[],
        parent,
        level + 1
      );
    }
  }

  refactorDocumentation(object: DocEntry): DocEntry {
    let deleteDocumentation = false;
    if (typeof object != 'string' && !isId(object) && object?.documentation) {
      if (
        typeof object?.documentation != 'string' &&
        !isId(object?.documentation) &&
        object?.documentation?.parameters
      ) {
        if (object?.parameters) {
          const oP = object?.parameters?.map((p) =>
            typeof p != 'string' && !isId(p) ? p?.name : p
          );
          const dP = object?.documentation?.parameters?.map((p) =>
            typeof p != 'string' && !isId(p) ? p?.name : p
          );
          if (oP?.length === dP?.length) {
            for (let index = 0; index < oP?.length; index++) {
              if (dP.find((p) => p === oP[index]) == undefined) {
                deleteDocumentation = true;
                break;
              }
            }
          } else deleteDocumentation = true;
          for (
            let index = 0;
            index < object?.documentation?.parameters.length;
            index++
          ) {
            const parameter = object?.documentation?.parameters[index];
            let found = object?.parameters?.find((p) =>
              typeof p != 'string' && !isId(p)
                ? p?.name ===
                  (typeof parameter != 'string' && !isId(parameter)
                    ? parameter?.name
                    : parameter)
                : p ===
                  (typeof parameter != 'string' && !isId(parameter)
                    ? parameter?.name
                    : parameter)
            );
            if (found) {
              found = this.toObject(found);
              found.text =
                typeof parameter != 'string' && !isId(parameter)
                  ? parameter?.text
                  : parameter?.toString();
              object.documentation.parameters[index] = undefined;
            }
          }
        } else deleteDocumentation = true;

        if (deleteDocumentation) {
          delete object.documentation;
        } else {
          object.documentation.parameters =
            object?.documentation?.parameters?.filter?.((p) => p);
          if (!object?.documentation?.parameters?.length)
            delete object.documentation.parameters;
          if (object.documentation.text) {
            object.text = object.documentation.text;
            delete object.documentation.text;
          }
          if (!Object.keys(object.documentation).length)
            delete object.documentation;
          if (!object.documentation) delete object.documentation;
        }
      }
    }
    return object;
  }

  refactorDocumentations(
    current?: DocEntry | DocEntry[]
  ): DocEntry | DocEntry[] {
    if (Array.isArray(current)) {
      for (let index = 0; index < current.length; index++) {
        current[index] = this.toObject(current[index]);
        for (const key in current[index] as BaseDocEntry) {
          if (
            Object.prototype.hasOwnProperty.call(current[index], key) &&
            current?.[index]?.[key]
          ) {
            this.refactorDocumentations(current[index]?.[key]);
          }
        }
      }
    } else {
      for (const key in current as BaseDocEntry) {
        if (
          Object.prototype.hasOwnProperty.call(current, key) &&
          current?.[key] &&
          (typeof current?.[key] === 'object' || Array.isArray(current?.[key]))
        ) {
          this.refactorDocumentations(current?.[key]);
        }
      }
      current = this.refactorDocumentation(current);
    }
    return current;
  }

  refactorLink(
    base: DocEntry[],
    parent: DocEntry | DocEntry[],
    index: string | number | undefined
  ): DocEntry[] {
    const element = index != undefined ? parent?.[index] : parent;
    const link = element.link;
    const linked = element.linked;
    const id = element.id;

    if (link && linked) {
      for (const linkedE of linked) {
        const found = base.findIndex((e) =>
          isId(e) ? e === linkedE : e?.id === linkedE
        );
        if (found != -1) {
          base[found] = this.toObject(base[found]);
          if (this.checkIsJustLink(base?.[found] as BaseDocEntry)) {
            base = this.refactorLink.bind(this)(base, base, found);
          }
          if ((base[found] as BaseDocEntry).link == id) {
            console.log('refactorLink before', base[found], element, linkedE);
            (base[found] as BaseDocEntry).link = link;
            console.log('refactorLink after', base[found], element, linkedE);
          } else {
            for (const key in base[found] as BaseDocEntry) {
              if (
                Object.prototype.hasOwnProperty.call(
                  base[found] as BaseDocEntry,
                  key
                )
              ) {
                if (typeof (base[found] as BaseDocEntry)[key] === 'object') {
                  const bElement = (base[found] as BaseDocEntry)[key];
                  if ((bElement as BaseDocEntry).link == id) {
                    console.log(
                      'refactorLink 2 before',
                      base[found],
                      element,
                      linkedE,
                      base.find((e) => (isId(e) ? e === link : e?.id === link))
                    );
                    (bElement as BaseDocEntry).link = link;
                    console.log(
                      'refactorLink 2 after',
                      base[found],
                      element,
                      linkedE
                    );
                  }
                } else if (Array.isArray((base[found] as BaseDocEntry)[key])) {
                  for (const bElement of (base[found] as BaseDocEntry)[key]) {
                    if ((bElement as BaseDocEntry).link == id) {
                      console.log(
                        'refactorLink 3 before',
                        base[found],
                        element
                      );
                      (bElement as BaseDocEntry).link = link;
                      console.log(
                        'refactorLink 3 after',
                        base[found],
                        element,
                        linkedE
                      );
                    }
                  }
                }
              }
            }
          }
        }
        element.linked = linked.filter((e) => e != linkedE);
      }
    }
    base = base.filter((e) => (isId(e) ? e != id : e?.id != id));
    return base;
  }

  checkIsJustLink(element?: BaseDocEntry): boolean {
    if (!element) return false;
    const link = element.link;
    const linked = element.linked;
    const id = element.id;
    const length = Object.keys(element).length;
    let ok = true;
    if (length === 4) {
      ok = Object.keys(element).includes('internal');
    } else if (length < 3 || length > 4) {
      ok = false;
    }
    const isLink = !!(link && linked && id && ok);
    return isLink;
  }

  refactorLinks(
    base: DocEntry[],
    parent?: DocEntry | DocEntry[],
    index?: string | number | undefined
  ): DocEntry[] {
    if (!parent) parent = base;
    const current = index != undefined ? parent[index] : parent;
    if (Array.isArray(current)) {
      for (let index = 0; index < current.length; index++) {
        base = this.refactorLinks(base, current, index);
      }
    } else if (typeof current === 'object') {
      if (this.checkIsJustLink(current as BaseDocEntry)) {
        base = this.refactorLink.bind(this)(base, parent, index);
      }
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          base = this.refactorLinks(base, current, key);
        }
      }
    }
    return base;
  }
}

export { Doc, DocEntry };
