/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// import _ from 'lodash'; //use _.isEqual(objectOne, objectTwo); // to compare objects
import { mongo, ObjectId } from 'mongoose';

import {
  Node,
  // Type,
  // Symbol,
  // ClassDeclaration,
  SyntaxKind,
  // Modifier,
  TypeChecker,
  CompilerOptions,
  // SymbolFlags,
  // TypeFlags,
  createCompilerHost,
  createProgram,
  forEachChild,
  findConfigFile,
  readConfigFile,
  parseJsonConfigFileContent,
  // isExportDeclaration,
  sys,
  // isClassDeclaration,
  Declaration,
  displayPartsToString,
  getCombinedModifierFlags,
  // isFunctionDeclaration,
  // isInterfaceDeclaration,
  // isTypeAliasDeclaration,
  ModifierFlags,
  createSourceFile,
  ScriptTarget,
  // Signature,
  // SignatureKind,
  // SymbolDisplayPart,
  // SymbolTable,
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

// const caller = async <T>(toCall: (...a) => unknown, self, ...args) => {
//   return new Promise<T>((resolve, reject) => {
//     setTimeout(async () => {
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       const result: T = await toCall.bind(self)(...args);
//       resolve(result);
//     }, 0);
//   });
// };

function pushIfNotExists<T>(array: T[], item: T) {
  console.log('pushIfNotExists', array, item);
  if (!array.includes(item)) array.push(item);
}

function isObjectId(value: DocEntry): value is ObjectId {
  // console.log('isObjectId', value);
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

    this.refactorDocumentations(output);

    // console.log('output', JSON.stringify(output, null, 5));

    this.refactorObjects.bind(this)(output);

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
    // console.log('visit', SyntaxKind[node.kind]);
    // if (isClassDeclaration(node)) {
    //   console.log('class', node);
    // }
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      return;
    }

    // console.log(
    //   'visit a',
    //   SyntaxKind[node.kind],
    //   (node as { name?: any }).name
    // );

    // const type = (node as { name?: any })?.name
    //   ? this?.checker?.typeToString(
    //       this.checker?.getTypeAtLocation((node as { name?: any }).name),
    //       node
    //     )
    //   : undefined;
    const newNode = this.serializeNode(node);
    // console.log('newNode', newNode);
    // output?.push({ node: newNode, type } as DocEntry);
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
      if (!doc?.expression) delete doc.expression;
      if (!doc?.arguments?.length) delete doc.arguments;
      if (!doc?.parameters?.length) delete doc.parameters;
      if (!doc?.statements?.length) delete doc.statements;
      if (!doc?.modifiers?.length) delete doc.modifiers;
      if (!doc?.initializer) delete doc.initializer;
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

  serializeNode(node?: Node) {
    if (node == undefined) return undefined;

    let type =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      node?.type?.kind !== undefined ? SyntaxKind[node?.type?.kind] : undefined;
    const fullTypeName = this.checker?.getTypeAtLocation(
      (node as { name?: any }).name
    );
    // const fullType = this.checker?.getTypeAtLocation(node);
    const typeName = fullTypeName
      ? this?.checker?.typeToString(fullTypeName, node)
      : undefined;

    // const fullType = this.checker?.getTypeAtLocation(node);

    if (typeName?.includes('=>') && type == undefined) {
      const sourceFile = createSourceFile(
        'temp',
        `type temp = ${typeName}`,
        this.options?.target || ScriptTarget.ES2015,
        true
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      type = SyntaxKind[sourceFile?.statements?.[0]?.type?.type?.kind];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let name: string | undefined = node?.name?.escapedText?.toString();

    const declaration = this.serializeNode.bind(this)(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      node?.declarationList?.declarations?.[0]
    );

    if (name == undefined) {
      // console.log(
      //   'name is',
      //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //   // @ts-ignore
      //   declaration?.name,
      //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //   // @ts-ignore
      //   node?.declarationList?.declarations?.[0]?.initializer
      // );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      name = declaration?.name;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const initializer = this.serializeNode.bind(this)(node?.initializer);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const operatorValue = node?.operatorToken?.kind;
    const operator = SyntaxKind[operatorValue];
    const operation = operatorToOperation[operatorValue];
    const operationName = Operation[operation];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const left = this.serializeNode.bind(this)(node?.left);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const right = this.serializeNode.bind(this)(node?.right);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let id;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id = this.checker?.getSymbolAtLocation?.(node)?.id;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id = node?.id;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const _extends = node?.heritageClauses?.map((clause) => {
      return clause.types.map((type) => {
        // return this.checker?.getTypeAtLocation(type.expression)?.symbol?.name;
        return this.serializeNode.bind(this)(type);
      });
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const members: DocEntry[] = node?.members?.map((value) =>
      this.serializeNode.bind(this)(value)
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const parameters: DocEntry[] = node?.parameters?.map((value) =>
      this.serializeNode.bind(this)(value)
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const statements: DocEntry[] = node?.statements?.map((value) =>
      this.serializeNode.bind(this)(value)
    );

    const modifiers = node?.modifiers?.map((modifier) => {
      return SyntaxKind[modifier.kind];
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const body = this.serializeNode.bind(this)(node?.body);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const expression = this.serializeNode.bind(this)(node?.expression);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const _arguments = node?.arguments?.map((argument) => {
      return this.serializeNode.bind(this)(argument);
    });

    const code = node?.getText();

    const documentation =
      this.serializeDocumentation.bind(this)(node) ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.serializeDocumentation.bind(this)(node.name);
    const entry: DocEntry = {
      id: id != undefined ? id : newId(),
      name,
      code,
      body,
      type,
      typeName,
      initializer,
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

    const cleaned = this.cleanUp(entry);
    // console.log('a cleaned node:', cleaned);

    // if (name === 'setName') {
    //   console.log(
    //     'a cleaned node:',
    //     cleaned,
    //     this.serializeDocumentation.bind(this)(node),
    //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //     // @ts-ignore
    //     this.serializeDocumentation.bind(this)(node.name),
    //     this.serializeDocumentation.bind(this)(fullTypeName as unknown as Node)
    //   );
    // }

    return cleaned;
  }

  serializeDocumentation(node?: Node) {
    if (node == undefined) return undefined;
    let symbol;
    try {
      symbol = this.checker?.getSymbolAtLocation?.(node);
    } catch (error) {
      symbol = node as unknown as Symbol;
    }
    const comments = symbol?.getDocumentationComment?.(this.checker);
    const text = displayPartsToString(comments);
    const documentation = {
      text,
    };

    const tags = symbol?.getJsDocTags?.();
    if (tags)
      for (const tag of tags) {
        const name = tag.name === 'param' ? 'parameters' : tag.name;
        if (documentation[name] === undefined) documentation[name] = [];
        if (tag.text)
          if (name === 'parameters') {
            const parameterName = tag.text.filter(
              (p) => p.kind === 'parameterName'
            )[0].text;
            const parameterText = tag.text
              .filter((p) => p.kind === 'text')
              .map((p) => p.text.trim())
              .filter((p) => p && p !== '')
              .join(' ');
            const doc: DocEntry = {
              name: parameterName,
              text: parameterText,
            } as unknown as BaseDocEntry;
            if (doc?.text?.[0] === '-') doc.text = doc.text.slice(1).trim();
            if (!doc.text) documentation[name].push(parameterName);
            else documentation[name].push(doc);
          } else documentation[name].push(...tag.text.map((x) => x.text));
        else documentation[name].push(true);
      }
    if (!tags || (!tags.length && !text)) return undefined;
    return documentation;
  }

  toObject(object?: DocEntry) {
    // console.log('toObject', object);
    if (isId(object)) object = { id: object };
    else if (typeof object === 'string') object = { name: object };
    return object as BaseDocEntry;
  }

  linkObject(newObject?: DocEntry, parent?: DocEntry) {
    const currentObject: BaseDocEntry = {
      link: isId(newObject) ? newObject : newObject?.id,
    };
    if (newObject) {
      newObject = this.toObject(newObject);
      newObject.linked = newObject.linked ? newObject.linked : [];
      // console.log('newObject', newObject, parent);
      if (parent) {
        console.log('link parent', parent);
        parent = this.toObject(parent);
        console.log('link parent 2', parent);
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (object?.id == 15 && object?.name == 'name') {
          console.log('object 15', object, found);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (found) {
          object = this.linkObject(found, parent);
        } else {
          const newObject = JSON.parse(JSON.stringify(object)) as BaseDocEntry;
          newObject.internal = true;
          object = this.linkObject(newObject, parent);

          console.log('newObject a', newObject);

          for (const key in newObject) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
              if (Array.isArray(object[key]) && object[key].length > 0)
                this.refactorObjects.bind(this)(
                  newObject[key],
                  base,
                  newObject,
                  level + 1
                );
              else if (typeof object[key] === 'object')
                newObject[key] = this.refactorObject.bind(this)(
                  newObject[key],
                  base,
                  newObject,
                  level + 1
                );
            }
          }

          base?.push(newObject);
        }
      } else if (level > 0) {
        if (parent == undefined) {
          console.log('parent is undefined', object);
        } else {
          console.log('parent is not undefined', object, parent);
        }
        object = this.toObject(object);
        for (const key in object) {
          console.log('key', key, Array.isArray(object[key]));
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
        if (base == current) {
          console.log('current I', current.length, index);
        }
        current[index] = this.toObject(current[index]);
        for (const key in current[index] as BaseDocEntry) {
          // console.log(`current[index][${key}]`);
          if (
            Object.prototype.hasOwnProperty.call(current[index], key) &&
            key !== 'linked' &&
            current?.[index]?.[key]
          ) {
            if (Array.isArray(current[index]?.[key])) {
              // console.log(`current[index][${key}] is array`);
              // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // // @ts-ignore
              // current[index][key] = current[index]?.[key]?.map((o) =>
              //   this.refactorObject(o, base, current?.[index], true)
              // );
              this.refactorObjects.bind(this)(
                current?.[index]?.[key],
                base,
                current?.[index],
                level + 1
              );
            } else if (typeof current[index]?.[key] === 'object') {
              // console.log(`current[index][${key}] is object`);
              current[index] = this.refactorObject.bind(this)(
                current[index],
                base,
                parent,
                level + 1
              );
            } else {
              // console.log(`current[index][${key}] is string`);
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
    // console.log('refactorObjects', JSON.stringify(current, null, 5));
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
          // console.log('deleteDocumentation', object);
          delete object.documentation;
        } else {
          // console.log('keepDocumentation', object);
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
        }
      }
    }
    return object;
  }

  refactorDocumentations(current?: DocEntry | DocEntry[]): void {
    if (Array.isArray(current)) {
      for (let index = 0; index < current.length; index++) {
        current[index] = this.toObject(current[index]);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // console.log(`current[index] ${current?.[index]?.name}`);
        for (const key in current[index] as BaseDocEntry) {
          // console.log(`current[index][${key}]`);
          if (
            Object.prototype.hasOwnProperty.call(current[index], key) &&
            current?.[index]?.[key]
          ) {
            if (Array.isArray(current[index]?.[key])) {
              // console.log(`current[index][${key}] is array`);
              this.refactorDocumentations(current?.[index]?.[key]);
            } else if (typeof current[index]?.[key] === 'object') {
              // console.log(`current[index][${key}] is object`);
              current[index] = this.refactorDocumentation(current[index]);
            } else {
              // console.log(`current[index][${key}] is string`);
            }
          }
        }
      }
    } else {
      // console.log('current is not array');
      current = this.refactorDocumentation(current);
    }
  }
}

export { Doc, DocEntry };
