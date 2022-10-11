/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
} from 'typescript';

interface ODocEntry {
  modifiers?: DocEntry[];
  name?: string;
  text?: string;
  fileName?: string;
  documentation?: DocEntry;
  type?: DocEntry;
  types?: DocEntry[];
  constructors?: DocEntry[];
  call?: DocEntry[];
  implements?: DocEntry[];
  extends?: DocEntry[];
  parameters?: DocEntry[];
  members?: DocEntry[];
  returnType?: DocEntry;
}

type DocEntry = ODocEntry | string;

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
  visit(node: Node, output?: Array<DocEntry | string>) {
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

  serializeType(type: Type, node?: Node) {
    const constructors = type
      .getConstructSignatures()
      .map((symbol) => this.serializeSignature(symbol, node));

    const call = type
      .getCallSignatures()
      .map((symbol) => this.serializeSignature(symbol, node));

    const name =
      (type as unknown as { intrinsicName: string })?.intrinsicName ||
      this.checker?.typeToString(type);

    console.log('type:', name); //, (type as any).types);

    const documentation = this.serializeDocumentation.bind(this)(type.symbol);

    const serializedType: DocEntry = {
      constructors,
      call,
      documentation,
      name,
      type:
        type?.flags === TypeFlags.Union
          ? 'or'
          : type?.flags === TypeFlags.Intersection
          ? 'and'
          : undefined,
      types: (type as any).types?.map((x: Type) => this.serializeType(x, node)),
    };
    if (!serializedType.documentation) delete serializedType.documentation;
    if (!serializedType.constructors?.length)
      delete serializedType.constructors;
    if (!serializedType.call?.length) delete serializedType.call;
    if (!serializedType.name) delete serializedType.name;
    if (!serializedType?.types?.length) delete serializedType?.types;
    if (!serializedType?.type) delete serializedType?.type;

    if (Object.getOwnPropertyNames(serializedType).length === 1 && name)
      return name;
    return serializedType;
  }

  /** Serialize a symbol into a json object */
  serializeSymbol(symbol?: Symbol, node?: Node): DocEntry | string {
    const classDeclaration = node as ClassDeclaration;
    const _extends = classDeclaration?.heritageClauses?.map((clause) => {
      return clause.types.map((type) => {
        // return this.checker?.getTypeAtLocation(type.expression)?.symbol?.name;
        return this.serializeSymbol.bind(this)(
          this.checker?.getSymbolAtLocation(type.expression),
          type.expression
        );
      });
    });
    const members: Array<DocEntry | string> = [];
    symbol?.members?.forEach((value, key) => {
      members.push(this.serializeSymbol.bind(this)(value, node));
    });
    let name = symbol?.getName();
    let serializedType: DocEntry | string | undefined = undefined;
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
      serializedType = this.serializeType.bind(this)(type, node);
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
    if (!entry?.members?.length) delete entry?.members;
    if (!entry?.extends?.length) delete entry?.extends;
    if (!entry?.documentation) delete entry?.documentation;
    if (!entry?.type) delete entry?.type;
    if (
      !entry?.types ||
      !entry?.types?.length ||
      (entry?.types?.length === 1 &&
        ((typeof entry?.types?.[0] != 'string' &&
          entry?.types?.[0]?.name === 'error') ||
          entry?.types?.[0] === 'error'))
    )
      delete entry?.types;

    if (Object.getOwnPropertyNames(entry).length === 1 && name) return name;

    return entry;
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

    details.constructors = constructorType
      ?.getConstructSignatures()
      ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node));

    details.call = constructorType
      ?.getCallSignatures()
      ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node));

    if (!details.constructors?.length) delete details.constructors;
    if (!details.call?.length) delete details.call;

    return details;
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
      node
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
