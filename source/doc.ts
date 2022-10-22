// import _ from 'lodash'; //use _.isEqual(objectOne, objectTwo); // to compare objects
import { flatMap } from 'lodash';
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

interface DocumentationEntry {
  id?: string | number;
  kind?: string;
  name?: string | number | boolean;
  value?: string | number | boolean;
  parameters?: DocumentationEntry[];
  elements?: DocumentationEntry[];
  variations?: DocumentationEntry[];
}

interface DocumentationElement {
  id?: string | number;
  kind?: string;
  name?: string;
  elements?: DocumentationElement[];
}

interface SimpleDocumentationEntry {
  id?: string | number;
  elements?: DocumentationElement[];
  kind?: string;
  name?: string;
  value?: boolean | number | string | SimpleDocumentationEntry[];
}

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
  declarations?: DocEntry[];
  operator?: string;
  operation?: Operation;
  operationName?: string;
  left?: DocEntry;
  right?: DocEntry;
  flow?: DocEntry;
  arguments?: DocEntry[];
  statements?: DocEntry[];
  thenStatement?: DocEntry;
  elseStatement?: DocEntry;
  fileName?: string;
  documentation?: DocumentationEntry;
  flags?: string;
  type?: DocEntry;
  typeName?: string;
  kind?: DocEntry;
  properties?: DocEntry[];
  types?: DocEntry[];
  signatures?: DocEntry[];
  implements?: DocEntry[];
  extends?: DocEntry[];
  parameters?: DocEntry[];
  members?: DocEntry[];
  returnType?: DocEntry;
}

type DocEntry = BaseDocEntry | string | Id | undefined;

// type BaseDocNode = Node & {
//   name?: BaseDocNode;
//   kind?: SyntaxKind | string;
//   text?: BaseDocNode | BaseDocNode[] | string | string[];
//   comment?: BaseDocNode;
//   escapedText?: BaseDocNode;
//   left?: BaseDocNode;
//   right?: BaseDocNode;
// };

// type DocNode = BaseDocNode | string;

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
    currentDir?: string,
    depth = 15
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
    // eslint-disable-next-line prefer-const
    let output: DocEntry[] = [];

    const visit = (node: Node) => this.visit(node, output, rootDir, depth);

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        // Walk the tree to search for classes
        forEachChild(sourceFile, visit.bind(this));
      }
    }

    // output = this.refactorDocumentations.bind(this)(output) as DocEntry[];

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
  visit(
    node: Node,
    output?: Array<DocEntry>,
    rootDir?: string,
    depth = 15
  ): void {
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      // console.log('not exported', SyntaxKind[node.kind]);
      return;
    }

    const newNode = this.serializeNode(node, output, depth);

    output?.push(newNode);
    forEachChild(node, (node) =>
      this.visit.bind(this)(node, output, rootDir, depth - 1)
    );
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
      if (!doc?.flow) delete doc.flow;
      if (!doc?.typeName) delete doc.typeName;
      if (!doc?.operationName) delete doc.operationName;
      if (!doc?.expression) delete doc.expression;
      if (!doc?.thenStatement) delete doc.thenStatement;
      if (!doc?.elseStatement) delete doc.elseStatement;
      if (!doc?.properties?.length) delete doc.properties;
      if (!doc?.arguments?.length) delete doc.arguments;
      if (!doc?.parameters?.length) delete doc.parameters;
      if (!doc?.statements?.length) delete doc.statements;
      if (!doc?.modifiers?.length) delete doc.modifiers;
      if (!doc?.initializer) delete doc.initializer;
      if (!doc?.declarations?.length) delete doc.declarations;
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

  serializeNode(node?: Node, base?: DocEntry[], depth?: number): DocEntry {
    if (node == undefined || !depth) return undefined;

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
    id = id != undefined ? id : newId();

    let name: string | undefined = (
      node as unknown as { name: { escapedText: string } }
    )?.name?.escapedText?.toString();

    const code = node?.getText?.();
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

    node['id'] = node['id'] || id;

    const documentation = this.reduceDocumentation.bind(this)(
      this.serializeDocumentation.bind(this)(node)
    );
    // if (documentation)
    //   console.log('f documentation', JSON.stringify(documentation, null, 5));

    const initializer = this.serializeNode.bind(this)(
      (node as unknown as { initializer: Node })?.initializer,
      base,
      depth - 1
    );

    const left = this.serializeNode.bind(this)(
      (node as unknown as { left: Node })?.left,
      base,
      depth - 1
    );

    const right = this.serializeNode.bind(this)(
      (node as unknown as { right: Node })?.right,
      base,
      depth - 1
    );

    const body = this.serializeNode.bind(this)(
      (node as unknown as { body: Node })?.body,
      base,
      depth - 1
    );

    const expression = this.serializeNode.bind(this)(
      (node as unknown as { expression: Node })?.expression,
      base,
      depth - 1
    );

    const thenStatement = this.serializeNode.bind(this)(
      (node as unknown as { thenStatement: Node })?.thenStatement,
      base,
      depth - 1
    );

    const elseStatement = this.serializeNode.bind(this)(
      (node as unknown as { elseStatement: Node })?.elseStatement,
      base,
      depth - 1
    );

    const flow = this.serializeNode.bind(this)(
      (node as unknown as { flowNode: { node: Node } })?.flowNode?.node,
      base,
      depth - 1
    );

    let declarations = (
      node as unknown as { declarationList?: { declarations: Node[] } }
    )?.declarationList?.declarations.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base, depth - 1)
    );

    if (name == undefined && typeof declarations?.[0] == 'object') {
      name = (declarations?.[0] as BaseDocEntry)?.name;
    }

    const _extends = (
      node as unknown as { heritageClauses: { types: Node[] }[] }
    )?.heritageClauses?.map((clause) => {
      return clause.types.map((type: Node | undefined) => {
        return this.serializeNode.bind(this)(type, base, depth - 1);
      });
    });

    const members: DocEntry[] = (
      node as unknown as { members: Node[] }
    )?.members?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base, depth - 1)
    );

    const parameters: DocEntry[] = (
      node as unknown as { parameters: Node[] }
    )?.parameters?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base, depth - 1)
    );

    const statements: DocEntry[] = (
      node as unknown as { statements: Node[] }
    )?.statements?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base, depth - 1)
    );

    const properties: DocEntry[] = (
      node as unknown as { properties: Node[] }
    )?.properties?.map((value: Node | undefined) =>
      this.serializeNode.bind(this)(value, base, depth - 1)
    );

    const _arguments = (
      node as unknown as { arguments: Node[] }
    )?.arguments?.map((argument: Node | undefined) => {
      return this.serializeNode.bind(this)(argument, base, depth - 1);
    });

    if (SyntaxKind[node.kind] === 'Identifier' && declarations == undefined) {
      const symbol = this.checker?.getSymbolAtLocation?.(node);
      declarations = symbol?.declarations?.map((value: Node | undefined) =>
        this.serializeNode.bind(this)(value, base, depth - 1)
      );
    }

    // eslint-disable-next-line prefer-const
    let entry: DocEntry = {
      id,
      name,
      code,
      body,
      type,
      typeName,
      initializer,
      declarations,
      operator,
      operation,
      operationName,
      left,
      right,
      expression,
      flow,
      arguments: _arguments,
      properties,
      parameters,
      statements,
      thenStatement,
      elseStatement,
      modifiers,
      kind: SyntaxKind[node.kind],
      documentation,
      members,
      extends: _extends?.flat(),
    };

    // console.log('entry is', JSON.stringify(entry, null, 5));
    // if (
    //   // entry?.kind === 'Identifier' &&
    //   entry.id === 433
    // ) {
    //   console.log('entry is', node);
    // }

    // entry = this.refactorDocumentations.bind(this)(entry, base) as BaseDocEntry;

    entry.flow = this.linkObject.bind(this)(entry, base, 'flow');
    entry.initializer = this.linkObject.bind(this)(entry, base, 'initializer');
    entry.left = this.linkObject.bind(this)(entry, base, 'left');
    entry.right = this.linkObject.bind(this)(entry, base, 'right');
    entry.body = this.linkObject.bind(this)(entry, base, 'body');
    entry.expression = this.linkObject.bind(this)(entry, base, 'expression');
    entry.thenStatement = this.linkObject.bind(this)(
      entry,
      base,
      'thenStatement'
    );
    entry.elseStatement = this.linkObject.bind(this)(
      entry,
      base,
      'elseStatement'
    );

    entry.declarations = this.linkArray.bind(this)(entry, base, 'declarations');
    entry.properties = this.linkArray.bind(this)(entry, base, 'properties');
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

  // addDocumentation(
  //   tag: BaseDocNode,
  //   name: DocNode,
  //   documentation: DocumentationEntry
  // ) {
  //   if (name) {
  //     const base = name as BaseDocNode;
  //     const newName = (base?.name ||
  //       base?.text ||
  //       base?.escapedText ||
  //       base?.left?.name ||
  //       base?.left?.text ||
  //       base?.left?.escapedText ||
  //       name) as unknown as string;
  //     const text = tag?.text || tag?.comment;
  //     // if (typeof newName == 'object' || newName == '[object Object]') {
  //     //   console.log('newName is', newName);
  //     // }
  //     if (base?.right) {
  //       documentation = documentation == undefined ? {} : documentation;
  //       documentation.children = documentation.children || [];
  //       const newDoc: DocumentationEntry = {
  //         name: newName,
  //       };
  //       documentation.children.push(newDoc);
  //       const right = base?.right;
  //       this.addDocumentation.bind(this)(
  //         tag,
  //         right,
  //         documentation.children[documentation.children.length - 1]
  //       );
  //     } else if (typeof newName != 'object' || newName != '[object Object]') {
  //       if (documentation[newName] === undefined) documentation[newName] = [];
  //       if (text) {
  //         if (newName === 'parameters') {
  //           const parameterName = (text as unknown as BaseDocNode[]).filter(
  //             (p) => typeof p.kind === 'string' && p.kind === 'parameterName'
  //           )[0].text as string;
  //           const parameterText = (text as unknown as BaseDocNode[])
  //             .filter((p) => typeof p.kind === 'string' && p.kind === 'text')
  //             .map((p) => typeof p.text === 'string' && p?.text?.trim())
  //             .filter((p) => p && p !== '')
  //             .join(' ');
  //           const doc: DocumentationEntry = {
  //             name: parameterName,
  //             text: parameterText,
  //           };
  //           console.log('Add doc', JSON.stringify(doc, null, 5));
  //           if (doc?.text?.[0] === '-') doc.text = doc.text.slice(1).trim();
  //           if (!doc.text)
  //             documentation[newName]?.push({ name: parameterName });
  //           else documentation[newName]?.push(doc);
  //         } else if (typeof tag.name != 'object') {
  //           console.log('newName is', newName, documentation);
  //           documentation.children = documentation.children || [];

  //           const children = (
  //             Array.isArray(text)
  //               ? text.map((x) => ({ name: newName, text: x.text }))
  //               : [{ name: newName, text }]
  //           ).reduce((acc, cur) => {
  //             if (cur?.text?.[0] === '-') cur.text = cur.text.slice(1).trim();
  //             if (cur.text) {
  //               if (!Array.isArray(acc)) acc = [acc];
  //               const found = acc.find((x) => x.name === cur.name);
  //               if (found) {
  //                 if (found.text) found.text += ` ${cur.text}`;
  //                 else found.text = cur.text;
  //               } else acc.push(cur);
  //             }
  //             return acc;
  //           }, [] as DocumentationEntry[]);

  //           if (newName === 'input') {
  //             console.log('tag is', tag, newName);
  //           }

  //           documentation.children.push(...children);
  //           console.log('newName was', newName, documentation);
  //         }
  //         console.log('newName is', newName, documentation);
  //       } else documentation[newName].push(true);
  //     }
  //   }
  // }

  getDocumentationElement(object, kind?: string): DocumentationElement {
    const left = object?.left;
    const right = object?.right;

    let eLeft: DocumentationElement | undefined;
    let eRight: DocumentationElement | undefined;

    if (left) {
      eLeft = this.getDocumentationElement.bind(this)(left, 'left');
    }

    if (right) {
      eRight = this.getDocumentationElement.bind(this)(right, 'right');
    }

    const name =
      eLeft?.name && eRight?.name
        ? `${eLeft.name}.${eRight.name}`
        : eLeft?.name ||
          eRight?.name ||
          object?.name ||
          object?.text ||
          object?.escapedText;

    const elements = [eLeft, eRight].filter((x) => x) as DocumentationElement[];

    const id = object?.id;

    const r: DocumentationElement = {
      id,
      name,
      elements,
      kind,
    };

    if (!r.id) delete r.id;
    if (!r.name) delete r.name;
    if (!r.elements?.length) delete r.elements;
    if (!r.kind) delete r.kind;
    return r;
  }

  toSimpleDocumentation(doc, id?: number | string): SimpleDocumentationEntry {
    // console.log('simple doc was', doc);
    let kind = doc?.kind
      ? SyntaxKind[doc?.kind] || doc?.kind
      : doc?.name
      ? 'parameterName'
      : 'text';
    kind =
      kind === 'JSDocTag' || kind === 'JSDoc' || kind === 'JSDocComment'
        ? 'text'
        : kind;
    kind = kind.includes('Tag') ? 'parameter' : kind;
    let value = doc?.comment || doc?.text || true;
    if (Array.isArray(value)) {
      kind = 'documentation';
      value = value.map((x) => this.toSimpleDocumentation.bind(this)(x, id));
    }
    const newDoc: SimpleDocumentationEntry = {
      kind,
      value,
    };

    if (doc?.name || doc?.tagName?.escapedText || doc?.tagName) {
      newDoc.name = doc.name || doc?.tagName?.escapedText || doc?.tagName;
    }

    if (typeof newDoc.name === 'object') {
      if (newDoc.name['left'] && typeof newDoc.name['left'] === 'object') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newDoc.name['left']['id'] = newDoc['id'] || id;
      }
      // console.log('newDoc.name is', id, newDoc.name);

      const element = this.getDocumentationElement(newDoc.name);
      newDoc.id = element.id;
      newDoc.name = element.name;
      newDoc.elements = element.elements;

      // console.log('simple doc is', JSON.stringify(newDoc, null, 5));
    }

    return newDoc;
  }

  toDocumentation(doc: SimpleDocumentationEntry): DocumentationEntry {
    // console.log('doc was', JSON.stringify(doc, null, 5));
    const newDoc: DocumentationEntry = {};
    if (Array.isArray(doc.value)) {
      let children = doc?.value?.map((x) => this.toDocumentation.bind(this)(x));
      const parameters = children
        ?.filter(
          (x) =>
            x.name ||
            doc.name ||
            doc.kind === 'name' ||
            doc.kind === 'parameter' ||
            doc.kind === 'parameterName'
        )
        ?.filter((x) => x);

      children = children
        ?.filter(
          (x) =>
            !(
              x.name ||
              doc.name ||
              doc.kind === 'name' ||
              doc.kind === 'parameterName'
            )
        )
        ?.filter((x) => x);

      const parameter = {};
      for (const parameterP of parameters) {
        for (const key in parameterP) {
          if (Object.prototype.hasOwnProperty.call(parameterP, key)) {
            if (parameter[key] && parameterP[key]) {
              parameter[key] = Array.isArray(parameter[key])
                ? parameter[key]
                : [parameter[key]];
              parameter[key].push(parameterP[key]);
            } else if (parameterP[key]) {
              parameter[key] = parameterP[key];
            }
          }
        }
      }
      if (newDoc?.parameters) {
        newDoc.parameters.push(parameter);
        newDoc.parameters = [...new Set(newDoc.parameters)].filter((x) => x);
      }

      newDoc.elements = children;
      if (!newDoc?.elements?.length) delete newDoc.elements;
      if (!newDoc?.parameters || !Object.keys(newDoc?.parameters)?.length)
        delete newDoc.parameters;
      // else console.log('newDoc.parameters is', newDoc.parameters);
    }
    let elements =
      doc?.elements?.length && JSON.parse(JSON.stringify(doc?.elements));
    if (typeof doc.value !== 'object') {
      if (doc.kind === 'text') {
        newDoc.value = doc.value;
      }
      if (
        (doc.kind === 'name' || doc.kind === 'parameterName') &&
        typeof doc.value !== 'object'
      ) {
        newDoc.name = doc.value;
      }
      if (doc.kind !== 'text' && doc.kind !== 'unknown') {
        newDoc.parameters = [];
        const value = doc.value;
        const name = doc.name || 'unknown';
        // const nElements = elements?.filter((x) => x?.name === name);
        // elements = elements?.filter((x) => x?.name !== name);
        const p: DocumentationEntry = { name, value };
        if (elements?.length) p.elements = elements;
        newDoc.parameters.push(p);
        elements = [];
        // console.log(
        //   `newDoc.parameters is`,
        //   newDoc.parameters[last],
        //   'elements is',
        //   elements
        // );
      }
    }
    if (
      doc.kind !== 'parameter' &&
      doc.kind !== 'parameterName' &&
      doc.kind !== 'text' &&
      doc.kind !== 'name'
    )
      newDoc.kind = doc.kind;
    if (doc.id) newDoc.id = doc.id;
    if (elements?.length) {
      // console.log('doc.elements is', JSON.stringify(elements, null, 5));
      newDoc.elements = elements.map((x) => this.toDocumentation.bind(this)(x));
    }
    // console.log('doc is', JSON.stringify(newDoc, null, 5));
    return newDoc;
  }

  reduceDocumentationElements(
    doc?: DocumentationEntry,
    key?: string
  ): DocumentationEntry | undefined {
    if (!doc || !key) return doc;
    console.log('r was', JSON.stringify(doc, null, 5), key);
    for (let index = 0; index < doc[key].length; index++) {
      const found = doc[key]
        .filter((_e, i) => i != index)
        .filter((x) => x.name === doc[key][index].name)
        .map((x) => {
          const x2 = JSON.parse(JSON.stringify(x));
          delete x2.name;
          return x2;
        });
      const toKill = doc[key]
        .map((a, i) => {
          const a2 = JSON.parse(JSON.stringify(a));
          a2.index = i;
          return a2;
        })
        .filter((_e, i) => i != index)
        .filter((x) => x.name === doc[key][index].name)
        .map((x) => x.index);
      console.log('found is', found, 'toKill is', toKill);
      if (found?.length) {
        const name = doc[key][index].name;
        const unnamed = JSON.parse(JSON.stringify(doc[key][index]));
        delete unnamed.name;
        doc[key][index] = {
          name,
          variations: [unnamed, ...found],
        };
        for (const kill of toKill) {
          doc[key].splice(kill, 1);
          index--;
        }
      }
    }
    console.log('r is', JSON.stringify(doc, null, 5));
  }

  // rearrangeParents(doc?: DocumentationEntry) {
  //   if (Array.isArray(doc?.parameters) && doc?.parameters?.length)
  //     for (let index = 0; index < doc.parameters.length; index++) {
  //       const parameter = doc.parameters[index];
  //       const others = doc.parameters?.filter((_x, i) => i != index);
  //       for (let index2 = 0; index2 < parameter.length; index2++) {
  //         const element = parameter[index2];
  //         const eParents = element?.elements.filter(
  //           (x) => x.kind === 'left'
  //         ) as DocumentationEntry[];
  //         const foundParents = others?.filter(
  //           (x) => eParents?.find((y) => y.name === x.name) //! use id
  //         );
  //         console.log('FOUND:', foundParents);
  //         if (foundParents?.length) {
  //           element.kind = 'child';
  //           for (const foundParent of foundParents) {
  //             foundParent.elements = foundParent.elements || [];
  //             foundParent.elements.push(element);
  //           }
  //           parameter.splice(index2, 1);
  //           index2--;
  //         }
  //       }
  //     }
  //   return doc;
  // }

  reduceDocumentation(
    docs?: DocumentationEntry[]
  ): DocumentationEntry | undefined {
    const newDoc: DocumentationEntry | undefined = {};
    if (!docs) return undefined;
    console.log('rdocs was', JSON.stringify(docs, null, 5));
    for (const doc of docs) {
      for (const key in doc) {
        if (Object.prototype.hasOwnProperty.call(doc, key)) {
          if (newDoc[key] && doc[key]) {
            newDoc[key] = Array.isArray(newDoc[key])
              ? newDoc[key]
              : [newDoc[key]];
            newDoc[key].push(...[doc[key]].flat());
            this.reduceDocumentationElements.bind(this)(newDoc, key);
          } else if (doc[key]) {
            newDoc[key] = doc[key];
          }
        }
      }
    }

    // console.log('rdocs a is', JSON.stringify(newDoc, null, 5));
    // newDoc = this.rearrangeParents.bind(this)(newDoc);
    console.log('rdocs is', JSON.stringify(newDoc, null, 5));
    return newDoc;
  }

  serializeDocumentation(node?: Node) {
    if (node == undefined) return undefined;
    // console.log('serializeDocumentation', node?.['id']);
    let symbol: ts.Symbol | undefined;
    try {
      symbol = this.checker?.getSymbolAtLocation?.(node);
      if (symbol) symbol['id'] = symbol['id'] || node['id'];
    } catch (error) {
      symbol = node as unknown as ts.Symbol;
    }

    const comments = [
      ...new Set(
        [
          ...[(node as unknown as { jsDoc: any })?.jsDoc]
            .flat()
            .filter((a) => a),
          ...[(node as unknown as { jsDoc: any })?.jsDoc]
            .flat()
            .map((a) => a?.tags)
            .flat()
            .filter((a) => a),
          ...[symbol?.getDocumentationComment?.(this.checker)]
            .flat()
            .filter((a) => a),
          ...[symbol?.getJsDocTags?.()].flat().filter((a) => a),
        ]?.map((doc) =>
          this.toSimpleDocumentation.bind(this)(
            doc,
            doc?.['id'] || node?.['id'] || symbol?.['id']
          )
        )
      ),
    ]?.filter((a) =>
      a && a?.value && typeof a?.value != 'object'
        ? a?.value?.toString()?.trim?.() !== ''
        : a?.value?.toString().length && a?.value?.toString().length > 0
    );
    if (!comments?.length) {
      return undefined;
    }
    // console.log(
    //   'comments are',
    //   JSON.stringify(comments, null, 5) //,
    //   // (node as any).jsDoc?.map((a) => a?.tags).flat()
    // );
    const newComments = comments
      ?.map((x) => this.toDocumentation.bind(this)(x))
      .filter((x) => x && Object.keys(x).length > 0);
    // console.log('newComments', JSON.stringify(newComments, null, 5));
    if (
      !newComments?.length &&
      node['name'] &&
      typeof node['name'] == 'object'
    ) {
      node['name']['id'] =
        node?.['name']?.['id'] || node?.['id'] || symbol?.['id'];
      return this.serializeDocumentation.bind(this)(node['name']);
    }
    return newComments;
  }

  // refactorDocumentation(object: DocEntry): DocEntry {
  //   let deleteDocumentation = false;
  //   if (typeof object != 'string' && !isId(object) && object?.documentation) {
  //     if (
  //       typeof object?.documentation != 'string' &&
  //       !isId(object?.documentation) &&
  //       object?.documentation?.parameters
  //     ) {
  //       if (object?.parameters) {
  //         const oP = object?.parameters?.map((p) =>
  //           typeof p != 'string' && !isId(p) ? p?.name : p
  //         );
  //         const dP = object?.documentation?.parameters?.map((p) =>
  //           typeof p != 'string' && !isId(p) ? p?.name : p
  //         );
  //         if (oP?.length === dP?.length) {
  //           for (let index = 0; index < oP?.length; index++) {
  //             if (dP.find((p) => p === oP[index]) == undefined) {
  //               deleteDocumentation = true;
  //               break;
  //             }
  //           }
  //         } else deleteDocumentation = true;
  //         for (
  //           let index = 0;
  //           index < object?.documentation?.parameters.length;
  //           index++
  //         ) {
  //           const parameter = object?.documentation?.parameters[index];
  //           let found = object?.parameters?.find((p) =>
  //             typeof p != 'string' && !isId(p)
  //               ? p?.name ===
  //                 (typeof parameter != 'string' && !isId(parameter)
  //                   ? parameter?.name
  //                   : parameter)
  //               : p ===
  //                 (typeof parameter != 'string' && !isId(parameter)
  //                   ? parameter?.name
  //                   : parameter)
  //           );
  //           if (found) {
  //             found = this.toObject(found);
  //             found.text =
  //               typeof parameter != 'string' && !isId(parameter)
  //                 ? parameter?.text
  //                 : parameter?.toString();
  //             if (object.documentation.parameters && index) {
  //               delete object.documentation.parameters[index];
  //             }
  //           }
  //         }
  //       } else deleteDocumentation = true;

  //       if (deleteDocumentation) {
  //         delete object.documentation;
  //       } else {
  //         object.documentation.parameters =
  //           object?.documentation?.parameters?.filter?.((p) => p);
  //         if (!object?.documentation?.parameters?.length)
  //           delete object.documentation.parameters;
  //         if (object.documentation.text) {
  //           object.text = object.documentation.text;
  //           delete object.documentation.text;
  //         }
  //         if (!Object.keys(object.documentation).length)
  //           delete object.documentation;
  //         if (!object.documentation) delete object.documentation;
  //       }
  //     }
  //   }
  //   return object;
  // }

  // refactorDocumentations(
  //   current?: DocEntry | DocEntry[],
  //   base?: DocEntry[],
  //   parent?: DocEntry
  // ): DocEntry | DocEntry[] {
  //   if (!base) base = Array.isArray(current) ? current : [current];
  //   if (Array.isArray(current)) {
  //     for (let index = 0; index < current.length; index++) {
  //       current[index] = this.toObject(current[index]);
  //       for (const key in current[index] as BaseDocEntry) {
  //         if (
  //           Object.prototype.hasOwnProperty.call(current[index], key) &&
  //           current?.[index]?.[key]
  //         ) {
  //           this.refactorDocumentations.bind(this)(
  //             current[index]?.[key],
  //             base,
  //             current[index]
  //           );
  //         }
  //       }
  //     }
  //   } else {
  //     for (const key in current as BaseDocEntry) {
  //       if (
  //         Object.prototype.hasOwnProperty.call(current, key) &&
  //         current?.[key] &&
  //         (typeof current?.[key] === 'object' || Array.isArray(current?.[key]))
  //       ) {
  //         this.refactorDocumentations.bind(this)(current?.[key], base, current);
  //       }
  //     }

  //     current = this.refactorDocumentation(current);

  //     let clear = false;

  //     if ((current as { of: Node })?.of) {
  //       const of = (current as { of: BaseDocEntry[] })?.of?.map((o) => o?.name);
  //       const nDoc = JSON.parse(JSON.stringify(current));
  //       delete nDoc.of;
  //       // console.log('nDoc', nDoc, of, base?.length);
  //       for (let index = 0; index < of.length; index++) {
  //         const name = of[index];
  //         const found = base?.filter((b) => {
  //           b = this.toObject(b);
  //           // console.log('b?.name', b?.name, name);
  //           return b?.name === name;
  //         });
  //         if (found?.length) {
  //           clear = true;
  //           // console.log('found', found);
  //           for (let index2 = 0; index2 < found.length; index2++) {
  //             found[index2] = this.toObject(found[index2]);
  //             (found[index2] as BaseDocEntry).documentation = nDoc;
  //           }
  //           (current as { of: BaseDocEntry[] }).of = (
  //             current as { of: BaseDocEntry[] }
  //           )?.of?.filter((o) => o?.name !== name);
  //         }
  //       }
  //       if (!(current as { of: BaseDocEntry[] }).of?.length && clear) {
  //         delete (current as { of?: BaseDocEntry[] })?.of;
  //         let toClear;
  //         if (parent) {
  //           toClear = base?.filter((b) => {
  //             return (
  //               (b as BaseDocEntry)?.id != undefined &&
  //               (parent as BaseDocEntry)?.id != undefined &&
  //               (b as BaseDocEntry)?.id === (parent as BaseDocEntry)?.id
  //             );
  //           });
  //         } else {
  //           current = undefined;
  //         }
  //         console.log('toClear', toClear, parent, base);
  //         if (toClear?.length) {
  //           console.log('toClear', toClear);
  //           for (let index = 0; index < toClear.length; index++) {
  //             delete (toClear[index] as BaseDocEntry)?.documentation;
  //           }
  //         } else if (parent) {
  //           delete (parent as BaseDocEntry)?.documentation;
  //         }
  //       }
  //     }
  //   }
  //   return current;
  // }

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
    if (p == undefined) return undefined;
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

export { Doc, DocEntry, BaseDocEntry, Id };
