/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
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

import { type } from 'os';
import {
  Node,
  Type,
  Symbol,
  ClassDeclaration,
  SyntaxKind,
  Modifier,
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
  SymbolDisplayPart,
  SymbolTable,
} from 'typescript';

interface ODocEntry {
  modifiers?: DocEntry[];
  name?: string;
  text?: string;
  fileName?: string;
  documentation?: DocEntry;
  type?: DocEntry;
  types?: DocEntry[];
  signatures?: DocEntry[];
  call?: DocEntry[];
  implements?: DocEntry[];
  extends?: DocEntry[];
  parameters?: DocEntry[];
  members?: DocEntry[];
  tempMembers?: SymbolTable;
  returnType?: DocEntry;
}

const caller = async <T>(toCall: (...a) => unknown, self, ...args) => {
  return new Promise<T>((resolve, reject) => {
    setTimeout(async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result: T = await toCall.bind(self)(...args);
      resolve(result);
    }, 0);
  });
};

type DocEntry = ODocEntry | string | undefined;

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
  ): Promise<DocEntry[]> {
    const { options, fileNames } = this.getOptions(override, currentDir);
    const host = createCompilerHost(options);
    // Build a program using the set of root file names in fileNames
    const program = createProgram(fileNames, options, host);

    // Get the checker, we will use it to find more about classes
    this.checker = program.getTypeChecker();
    const output: DocEntry[] = [];

    const visit = (node: Node) => this.visit(node, output);

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
      errors: fileContent.errors,
    };
  }

  /** visit nodes finding exported classes */
  visit(node: Node, output?: Array<DocEntry>) {
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      return;
    }

    const symbol = (node as { name?: any })?.name
      ? this.checker?.getSymbolAtLocation((node as { name?: any }).name)
      : undefined;

    if (symbol) {
      // console.log('node A', SyntaxKind[node.kind]);
      output?.push(this.serializeComponent.bind(this)(symbol, node));
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
            output?.push(this.serializeComponent.bind(this)(symbol, node));
        }
      }
      forEachChild(node, this.visit.bind(this));
    }
  }

  cleanUp(doc: DocEntry) {
    if (typeof doc === 'string') return doc;
    if (doc) {
      if (!doc?.documentation) delete doc.documentation;
      if (!doc?.signatures?.length) delete doc.signatures;
      if (!doc?.call?.length) delete doc.call;
      if (!doc?.name) delete doc.name;
      if (!doc?.types?.length) delete doc?.types;
      if (!doc?.type) delete doc?.type;
      if (!doc?.members?.length) delete doc?.members;
      if (!doc?.tempMembers || doc?.tempMembers?.size === 0)
        delete doc?.tempMembers;
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

  serializeType(type: Type, node?: Node, parentName?: string) {
    const name =
      (type as unknown as { intrinsicName: string })?.intrinsicName ||
      this.checker?.typeToString(type);

    if (name === parentName) return undefined;

    const constructors = type
      .getConstructSignatures()
      .map((symbol) => this.serializeSignature(symbol, node));

    const calls = type
      .getCallSignatures()
      .map((symbol) => this.serializeSignature(symbol, node));

    const tempMembers: SymbolTable | undefined = (type as unknown as Symbol)
      ?.members;

    // const members: Array<DocEntry> = [];
    // if ((name && this.baseTypes.includes(name)) || name === 'error')
    //   return name;
    // (type as unknown as Symbol)?.members?.forEach((value, key) => {
    //   members.push(this.serializeSymbol.bind(this)(value, node, name));
    // });

    const documentation = this.serializeDocumentation.bind(this)(type.symbol);

    let serializedType: DocEntry = {
      signatures: [...constructors, calls].flat(),
      documentation,
      tempMembers,
      name,
      type:
        type?.flags === TypeFlags.Union
          ? 'or'
          : type?.flags === TypeFlags.Intersection
          ? 'and'
          : undefined,
      types: (type as any).types?.map((x: Type) =>
        this.serializeType(x, node, name)
      ),
    };

    console.log('type:', serializedType);
    // console.log('type2:', members);
    // console.log('type3:', serializedType);

    serializedType = this.cleanUp(serializedType);

    console.log('type2:', serializedType);

    return serializedType;
  }

  /** Serialize a symbol into a json object */
  serializeSymbol(symbol?: Symbol, node?: Node, parentName?: string): DocEntry {
    const classDeclaration = node as ClassDeclaration;

    let name = symbol?.getName();
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
    const members: Array<DocEntry> = [];
    symbol?.members?.forEach((value, key) => {
      members.push(this.serializeSymbol.bind(this)(value, node, name));
    });
    let serializedType: DocEntry = undefined;
    const type: Type | undefined = symbol
      ? this.checker?.getTypeOfSymbolAtLocation(
          symbol,
          symbol.valueDeclaration!
        )
      : undefined;
    if (
      type &&
      !this.baseTypes.includes(
        (type as unknown as { intrinsicName: string }).intrinsicName
      )
    ) {
      serializedType = this.serializeType.bind(this)(type, node, name);
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

    if (
      serializedType &&
      typeof serializedType === 'string' &&
      serializedType == 'error'
    )
      serializedType = undefined;

    const documentation = this.serializeDocumentation.bind(this)(symbol);
    const entry: DocEntry = {
      //   modifiers:
      //     node && canHaveModifiers(node)
      //       ? (getModifiers(node) as any)
      //       : undefined,
      name,
      type: type?.flags === TypeFlags.Union ? TypeFlags[type.flags] : undefined,
      types: serializedType ? [serializedType] : undefined,
      documentation,
      members,
      extends: _extends?.flat(),
    };

    console.log('symbol:', entry);

    return this.cleanUp(entry);
  }

  /** Serialize a class symbol information */
  serializeComponent(symbol: Symbol, node?: Node) {
    const details = this.serializeSymbol.bind(this)(symbol, node);

    // Get the construct signatures
    const constructorType = this.checker?.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

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

  serializeDocumentation(element?: Symbol | Signature) {
    const text = displayPartsToString(
      element?.getDocumentationComment(this.checker)
    );
    const documentation = {
      text,
    };

    const tags = element?.getJsDocTags();
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
            } as unknown as ODocEntry;
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

    const returnType = this.serializeType.bind(this)(
      signature.getReturnType(),
      node,
      undefined
    );

    const documentation = this.serializeDocumentation.bind(this)(signature);

    const serializedSignature: DocEntry = {
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

export { Doc, DocEntry };
