/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// import _ from 'lodash'; //use _.isEqual(objectOne, objectTwo); // to compare objects
import { mongo } from 'mongoose';

/**
 *! TODO:
 *! After complete, compare objects if already exists in the structure,
 *! if it does, make a link to the existing object
 *! if it doesn't, add it to the structure and make a link to it
 *! then replace all tempMembers with real members using links
 *?TEMP MEMBERS:
 * const tempMembers: SymbolTable | undefined = (type as unknown as Symbol)?.members;
 *?TEMP MEMBERS:
 * const members: Array<DocEntry> = [];
 * if ((name && this.baseTypes.includes(name)) || name === 'error')
 *   return name;
 * (type as unknown as Symbol)?.members?.forEach((value, key) => {
 *   members.push(this.serializeSymbol.bind(this)(value, node, name));
 * });
 **/

/**
 *! TODO:
 *! Add special variables result
 *? Special variables: are variables that receives one or more
 *? environment variables
 **/

/**
 *! TODO:
 *! improve documentation with typescript types
 **/

import {
  Node,
  Type,
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
  isClassDeclaration,
  Declaration,
  // displayPartsToString,
  getCombinedModifierFlags,
  // isFunctionDeclaration,
  // isInterfaceDeclaration,
  // isTypeAliasDeclaration,
  ModifierFlags,
  // Signature,
  // SignatureKind,
  // SymbolDisplayPart,
  // SymbolTable,
} from 'typescript';

interface BaseDocEntry {
  modifiers?: DocEntry[];
  uid?: string;
  link?: DocEntry;
  linked?: DocEntry[];
  id?: string | number;
  name?: string;
  escapedName?: string;
  text?: string;
  fileName?: string;
  documentation?: DocEntry;
  flags?: string;
  type?: DocEntry;
  kind?: DocEntry;
  types?: DocEntry[];
  signatures?: DocEntry[];
  implements?: DocEntry[];
  extends?: DocEntry[];
  parameters?: DocEntry[];
  members?: DocEntry[];
  returnType?: DocEntry;
}

type DocEntry = BaseDocEntry | string;

interface BaseTempDocEntry {
  // tempMembers?: { key: string; value: Symbol }[];
  modifiers?: TempDocEntry[];
  uid?: string;
  link?: TempDocEntry;
  linked?: TempDocEntry[];
  id?: string | number;
  name?: string;
  escapedName?: string;
  text?: string;
  fileName?: string;
  documentation?: TempDocEntry;
  flags?: string;
  type?: TempDocEntry;
  kind?: TempDocEntry;
  types?: TempDocEntry[];
  signatures?: TempDocEntry[];
  implements?: TempDocEntry[];
  extends?: TempDocEntry[];
  parameters?: TempDocEntry[];
  members?: TempDocEntry[];
  returnType?: TempDocEntry;
}

type TempDocEntry = BaseTempDocEntry | string | undefined;

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

// function pushIfNotExists<T>(array: T[], item: T) {
//   if (!array.includes(item)) array.push(item);
// }

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
  protected checker: TypeChecker | undefined;
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
  ): Promise<TempDocEntry[]> {
    const { options, fileNames, rootDir } = this.getOptions(
      override,
      currentDir
    );
    const host = createCompilerHost(options);
    // Build a program using the set of root file names in fileNames
    const program = createProgram(fileNames, options, host);

    // Get the checker, we will use it to find more about classes
    this.checker = program.getTypeChecker();
    const output: TempDocEntry[] = [];

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
  visit(node: Node, output?: Array<TempDocEntry>, rootDir?: string): void {
    // console.log('visit', SyntaxKind[node.kind]);
    if (isClassDeclaration(node)) {
      console.log('class', node);
    }
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      return;
    }

    console.log(
      'visit a',
      SyntaxKind[node.kind],
      (node as { name?: any }).name
    );

    const type = (node as { name?: any })?.name
      ? this.serializeType(
          this.checker?.getTypeAtLocation((node as { name?: any }).name),
          node
        )
      : undefined;
    const newNode = this.serializeNode(node);
    console.log('newNode', newNode);
    output?.push({ node: newNode, type } as TempDocEntry);
    forEachChild(node, (node) => this.visit.bind(this)(node, output, rootDir));
  }

  cleanUp(doc: TempDocEntry) {
    if (typeof doc === 'string') return doc;
    if (doc) {
      if (!doc?.documentation) delete doc.documentation;
      if (!doc?.signatures?.length) delete doc.signatures;
      if (doc?.id == undefined) delete doc.id;
      if (!doc?.name) delete doc.name;
      if (!doc?.escapedName || doc?.escapedName == 'default')
        delete doc.escapedName;
      if (!doc?.types?.length) delete doc?.types;
      if (!doc?.type) delete doc?.type;
      if (!doc?.members?.length) delete doc?.members;
      // if (!doc?.tempMembers || doc?.tempMembers?.length === 0) {
      //   doc.tempMembers = undefined;
      //   delete doc?.tempMembers;
      // }
      if (!doc?.extends?.length) delete doc?.extends;
      if (
        !doc?.types ||
        !doc?.types?.length ||
        (doc?.types?.length === 1 &&
          ((typeof doc?.types?.[0] != 'string' &&
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const type = node?.type
      ? this.serializeType(
          this.checker?.getTypeAtLocation((node as { name?: any }).name),
          node
        )
      : undefined;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const name: string | undefined = node?.name?.escapedText?.toString();
    console.log(
      'serializeNode a',
      SyntaxKind[node.kind],
      (node as { name?: any }).name
    );

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

    const members: TempDocEntry[] = [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    node?.members?.forEach((value) => {
      members.push(this.serializeNode.bind(this)(value));
    });

    // const documentation = this.serializeDocumentation.bind(this)(symbol);
    const entry: TempDocEntry = {
      //   modifiers:
      //     node && canHaveModifiers(node)
      //       ? (getModifiers(node) as any)
      //       : undefined,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id,
      uid: new mongo.ObjectId().toString(),
      name,
      type,
      kind: SyntaxKind[node.kind],
      // documentation,
      members,
      extends: _extends?.flat(),
    };

    const cleaned = this.cleanUp(entry);
    console.log('a cleaned node:', cleaned);

    return cleaned;
  }

  serializeType(type?: Type, node?: Node) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.log('serializeType', this.checker.typeToString(type as Type, node));
    return this?.checker?.typeToString(type as Type, node);
  }
}

export { Doc, TempDocEntry as DocEntry };
