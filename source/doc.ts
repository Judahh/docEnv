/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import _ from 'lodash'; //use _.isEqual(objectOne, objectTwo); // to compare objects

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
  Symbol,
  ClassDeclaration,
  SyntaxKind,
  // Modifier,
  TypeChecker,
  CompilerOptions,
  SymbolFlags,
  TypeFlags,
  createCompilerHost,
  createProgram,
  forEachChild,
  findConfigFile,
  readConfigFile,
  parseJsonConfigFileContent,
  isExportDeclaration,
  sys,
  isClassDeclaration,
  Declaration,
  displayPartsToString,
  getCombinedModifierFlags,
  isFunctionDeclaration,
  isInterfaceDeclaration,
  isTypeAliasDeclaration,
  ModifierFlags,
  Signature,
  // SymbolDisplayPart,
  // SymbolTable,
} from 'typescript';

interface BaseDocEntry {
  modifiers?: DocEntry[];
  id?: string | number;
  name?: string;
  escapedName?: string;
  text?: string;
  fileName?: string;
  documentation?: DocEntry;
  flags?: string;
  type?: DocEntry;
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
  id?: string | number;
  name?: string;
  escapedName?: string;
  text?: string;
  fileName?: string;
  documentation?: TempDocEntry;
  flags?: string;
  type?: TempDocEntry;
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

    // return output;
    const refactoredOutput = this.refactorObjects(output);

    return refactoredOutput as TempDocEntry[];
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

  refactorObjects(
    current?: TempDocEntry | TempDocEntry[],
    base?: TempDocEntry[]
  ): TempDocEntry | TempDocEntry[] {
    if (!base) base = Array.isArray(current) ? current : [current];
    if (Array.isArray(current)) {
      const newOutput = current?.map((entry) => {
        if (typeof entry !== 'object') return entry;

        const newEntry: TempDocEntry = {};
        for (const key in entry) {
          if (Object.prototype.hasOwnProperty.call(entry, key)) {
            const element = entry[key];
            if (Array.isArray(element)) {
              newEntry[key] = this.refactorObjects(element, current);
            } else if (typeof element === 'object') {
              const received = this.refactorObjects.bind(this)(
                element,
                current
              );
              newEntry[key] = Array.isArray(received)
                ? received?.[0]
                : received;
            } else {
              newEntry[key] = element;
            }
          }
        }
        return newEntry;
      });
      console.log('refactorObjects', current, newOutput);

      return newOutput;
    } else {
      // Check if this output is duplicated
    }
    return current;
  }

  getComponentWithFileName(
    symbol?: Symbol,
    node?: Node,
    rootDir?: string
  ): TempDocEntry {
    const fileName = node?.getSourceFile()?.fileName;
    let component = this.serializeComponent.bind(this)(symbol, node);
    if (
      (rootDir == undefined || rootDir == '.') &&
      (fileName?.[0] == '/' || fileName == undefined)
    )
      return component;
    if (component && typeof component !== 'string') {
      component.fileName = fileName;
    } else {
      component = {
        fileName,
        name: component,
      };
    }
    return component;
  }

  /** visit nodes finding exported classes */
  visit(node: Node, output?: Array<TempDocEntry>, rootDir?: string): void {
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      return;
    }

    const symbol = (node as { name?: any })?.name
      ? this.checker?.getSymbolAtLocation((node as { name?: any }).name)
      : undefined;

    if (symbol) {
      output?.push(
        this.getComponentWithFileName.bind(this)(symbol, node, rootDir)
      );
    } else {
      // console.log('node B', SyntaxKind[node.kind]);
      if (isExportDeclaration(node)) {
        const symbols = this.checker?.getSymbolsInScope(
          node,
          SymbolFlags.BlockScopedVariable
        );
        for (const symbol of symbols || []) {
          const name = symbol.getName();
          const type = symbol
            ? this.checker?.typeToString(
                this.checker?.getTypeOfSymbolAtLocation(
                  symbol,
                  symbol.valueDeclaration!
                )
              )
            : undefined;

          if (
            (name === 'name' && type === 'void') ||
            (name === 'expect' && type === 'Expect')
          ) {
            continue;
          }
          if (symbol)
            output?.push(
              this.getComponentWithFileName.bind(this)(symbol, node, rootDir)
            );
        }
      }
      forEachChild(node, this.visit.bind(this));
    }
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

  getTypedSymbol(symbol?: Symbol | Type | Signature) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (symbol.getName && typeof symbol.getName === 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // console.log('symbol', symbol.getName(), symbol.name);
      return { symbol: symbol as Symbol, type: 'Symbol' };
    } else {
      // console.log('type', symbol);
      return { symbol: symbol as Type, type: 'Type' };
    }
    // console.log('undefined', symbol);
    return undefined;
  }

  getFlags(symbol?: Symbol | Type) {
    const typedSymbol = this.getTypedSymbol(symbol);
    if (typedSymbol?.type === 'Symbol') {
      return SymbolFlags[typedSymbol.symbol.getFlags()];
    } else if (typedSymbol?.type === 'Type') {
      return TypeFlags[typedSymbol.symbol.getFlags()];
    }
    return undefined;
  }

  getName(symbol?: Symbol | Type) {
    const typedSymbol = this.getTypedSymbol(symbol);
    // console.log('typedSymbol getName', typedSymbol);
    let name = undefined;
    if (typedSymbol?.type === 'Symbol') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      name = symbol?.name;
    } else if (typedSymbol?.type === 'Type') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      name =
        (symbol as unknown as { intrinsicName: string })?.intrinsicName ||
        this.checker?.typeToString(symbol as Type);
    }
    return name;
  }

  getSignatures(symbol?: Symbol | Type, node?: Node, isConstructor?: boolean) {
    // console.log('getSignatures', symbol, node, isConstructor);

    if (
      isConstructor &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      symbol?.getConstructSignatures &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      typeof symbol?.getConstructSignatures === 'function'
    )
      return (
        symbol
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ?.getConstructSignatures()
          ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node))
      );
    if (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      symbol?.getCallSignatures &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      typeof symbol?.getCallSignatures === 'function'
    )
      return (
        symbol
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ?.getCallSignatures()
          ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node))
      );
    return [];
  }

  getTempMembers(symbol?: Symbol | Type) {
    const tempMembers: { key: string; value: Symbol }[] = [];
    (symbol as unknown as Symbol)?.members?.forEach((symbol, key) =>
      tempMembers.push({ key: key.toString(), value: symbol })
    );
    return tempMembers;
  }

  getType(symbol?: Symbol | Type, flags?: string) {
    const typedSymbol = this.getTypedSymbol(symbol);
    if (flags === 'Class' || flags === 'Interface') return flags;
    if (typedSymbol?.type === 'Symbol') {
      return symbol?.flags ? TypeFlags[symbol.flags] : undefined;
    } else if (typedSymbol?.type === 'Type') {
      return symbol?.flags === TypeFlags.Union
        ? 'or'
        : symbol?.flags === TypeFlags.Intersection
        ? 'and'
        : undefined;
    }
    return undefined;
  }

  getTypes(symbol?: Symbol | Type, node?: Node, name?: string) {
    const typedSymbol = this.getTypedSymbol(symbol);
    if (typedSymbol?.type === 'Symbol') {
      const type: Type | undefined = symbol
        ? this.checker?.getTypeOfSymbolAtLocation(
            symbol as Symbol,
            (symbol as Symbol).valueDeclaration!
          )
        : undefined;
      if (
        type &&
        !this.baseTypes.includes(
          (type as unknown as { intrinsicName: string }).intrinsicName
        )
      ) {
        let serializedType: TempDocEntry;
        if (
          serializedType &&
          typeof serializedType === 'string' &&
          serializedType == 'error'
        )
          serializedType = undefined;
        return serializedType
          ? [this.serializeSymbol.bind(this)(type, node, name)]
          : undefined;
      }
    } else if (typedSymbol?.type === 'Type') {
      return (symbol as any).types?.map((x: Type) =>
        this.serializeSymbol(x, node, name)
      );
    }
    return undefined;
  }

  refactorName(symbol?: Symbol | Type, node?: Node, name?: string) {
    const type: Type | undefined = symbol
      ? this.checker?.getTypeOfSymbolAtLocation(
          symbol as Symbol,
          (symbol as Symbol).valueDeclaration!
        )
      : undefined;
    if (
      type &&
      !this.baseTypes.includes(
        (type as unknown as { intrinsicName: string }).intrinsicName
      )
    ) {
      let typeString = type ? this.checker?.typeToString(type) : undefined;
      if (typeString === 'any' && node) {
        if (isClassDeclaration(node)) typeString = 'class';
        else if (isInterfaceDeclaration(node) || isTypeAliasDeclaration(node))
          typeString = 'interface';
        else if (isFunctionDeclaration(node)) typeString = 'function';
      }
      if (name === 'default' && typeString?.includes('typeof ')) {
        name = typeString.replace('typeof ', '');
        typeString = 'class';
      }
    }
    return name;
  }

  /** Serialize a symbol into a json object */
  serializeSymbol(
    symbol?: Symbol | Type,
    node?: Node,
    parentName?: string
  ): TempDocEntry {
    const classDeclaration = node as ClassDeclaration;
    const flags = this.getFlags(symbol);
    let name: string | undefined = this.getName(symbol);

    if ((name && this.baseTypes.includes(name)) || name === 'error')
      return name;

    // console.log('name', name, parentName);

    if (name === parentName) return undefined;

    const _extends = classDeclaration?.heritageClauses?.map((clause) => {
      return clause.types.map((type) => {
        // return this.checker?.getTypeAtLocation(type.expression)?.symbol?.name;
        return this.serializeSymbol.bind(this)(
          this.checker?.getSymbolAtLocation(type.expression),
          type.expression,
          name
        );
      });
    });

    // console.log('extends', _extends);

    const constructors = this.getSignatures.bind(this)(symbol, node, true);

    const calls = this.getSignatures.bind(this)(symbol, node);

    // const tempMembers: { key: string; value: Symbol }[] | undefined =
    //   this.getTempMembers(symbol);

    name = this.refactorName(symbol, node, name);

    const members: TempDocEntry[] = [];
    (symbol as unknown as Symbol)?.members?.forEach((value) => {
      members.push(this.serializeSymbol.bind(this)(value, node, name));
    });

    const documentation = this.serializeDocumentation.bind(this)(symbol);
    const entry: TempDocEntry = {
      //   modifiers:
      //     node && canHaveModifiers(node)
      //       ? (getModifiers(node) as any)
      //       : undefined,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: symbol?.id,
      name,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      escapedName: symbol?.escapedName,
      flags,
      signatures: [...constructors, ...calls].flat(),
      type: this.getType(symbol, flags),
      types: this.getTypes(symbol, node, name),
      documentation,
      members,
      extends: _extends?.flat(),
    };

    const cleaned = this.cleanUp(entry);
    // console.log('a cleaned symbol:', cleaned);

    return cleaned;
  }

  /** Serialize a class symbol information */
  serializeComponent(symbol?: Symbol, node?: Node) {
    const details = this.serializeSymbol.bind(this)(symbol, node);

    // Get the construct signatures
    const constructorType = symbol
      ? this.checker?.getTypeOfSymbolAtLocation(
          symbol,
          symbol.valueDeclaration!
        )
      : undefined;

    if (typeof details === 'string') return details;

    if (details)
      details.signatures = [
        ...(constructorType
          ?.getConstructSignatures()
          ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node)) ||
          []),
        ...(constructorType
          ?.getCallSignatures()
          ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node)) ||
          []),
      ].flat();

    return this.cleanUp(details);
  }

  serializeDocumentation(element?: Symbol | Type | Signature) {
    const type = this.getTypedSymbol(element)?.type;
    if (type === 'Type') {
      element = (element as Type).symbol;
    }
    const text = displayPartsToString(
      (element as Symbol)?.getDocumentationComment(this.checker)
    );
    const documentation = {
      text,
    };

    const tags = (element as Symbol)?.getJsDocTags();
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
            const doc: TempDocEntry = {
              name: parameterName,
              text: parameterText,
            } as unknown as BaseTempDocEntry;
            if (doc?.text?.[0] === '-') doc.text = doc.text.slice(1).trim();
            if (!doc.text) documentation[name].push(parameterName);
            else documentation[name].push(doc);
          } else documentation[name].push(...tag.text.map((x) => x.text));
        else documentation[name].push(true);
      }
    if (!tags || (!tags.length && !text)) return undefined;
    return documentation;
  }

  /** Serialize a signature (call or construct) */
  serializeSignature(signature: Signature, node?: Node) {
    const parameters = signature.parameters.map((symbol) =>
      this.serializeSymbol.bind(this)(symbol, node)
    );

    const returnType = this.serializeSymbol.bind(this)(
      signature.getReturnType(),
      node,
      undefined
    );

    const documentation = this.serializeDocumentation.bind(this)(signature);

    const serializedSignature: TempDocEntry = {
      parameters,
      returnType,
      documentation,
    };

    if (!serializedSignature?.parameters?.length)
      delete serializedSignature?.parameters;

    if (!serializedSignature?.documentation)
      delete serializedSignature?.documentation;

    return serializedSignature;
  }
  /** True if this is visible outside this file, false otherwise */
  isNodeExported(node: Node): boolean {
    return (
      (getCombinedModifierFlags(node as Declaration) & ModifierFlags.Export) !==
        0 ||
      (!!node?.parent && node?.parent?.kind === SyntaxKind.SourceFile)
    );
  }
}

export { Doc, TempDocEntry as DocEntry };
