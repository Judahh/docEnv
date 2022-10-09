/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ts from 'typescript';

interface DocEntry {
  modifiers?: ts.Modifier[] | string[] | ts.Modifier | string;
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  implements?: DocEntry[];
  extends?: DocEntry[];
  parameters?: DocEntry[];
  members?: DocEntry[];
  returnType?: string;
}

class Doc {
  protected checker: ts.TypeChecker | undefined;
  /** Generate documentation for all classes in a set of .ts files */
  async generateDocumentation(
    override?: {
      compilerOptions?: ts.CompilerOptions;
      include?: string[];
      exclude?: string[];
      files?: string[];
      extends?: string;
      filenames?: string[];
    },
    currentDir?: string
  ): Promise<DocEntry[]> {
    const { options, fileNames } = this.getOptions(override, currentDir);
    const host = ts.createCompilerHost(options);
    // Build a program using the set of root file names in fileNames
    const program = ts.createProgram(fileNames, options, host);

    // console.log('program', program);

    // Get the checker, we will use it to find more about classes
    this.checker = program.getTypeChecker();
    const output: DocEntry[] = [];

    const visit = (node: ts.Node) => this.visit(node, output);

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        // console.log('sourceFile', sourceFile);
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit.bind(this));
      }
    }

    return output;
  }

  getOptions(
    override: {
      compilerOptions?: ts.CompilerOptions;
      include?: string[];
      exclude?: string[];
      files?: string[];
      extends?: string;
      filenames?: string[];
    } = {},
    currentDir = '.'
  ) {
    const configFile = ts.findConfigFile(
      currentDir,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    if (!configFile) throw Error('tsconfig.json not found');
    const { config } = ts.readConfigFile(configFile, ts.sys.readFile);

    config.compilerOptions = Object.assign(
      {},
      config.compilerOptions,
      override.compilerOptions
    );
    if (override.include) config.include = override.include;
    if (override.exclude) config.exclude = override.exclude;
    if (override.files) config.files = override.files;
    if (override.extends) config.files = override.extends;

    const fileContent = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      currentDir
    );

    if (override.filenames) fileContent.fileNames = override.filenames;
    return {
      options: fileContent.options,
      fileNames: fileContent.fileNames,
      errors: fileContent.errors,
    };
  }

  /** visit nodes finding exported classes */
  visit(node: ts.Node, output?: DocEntry[]) {
    // Only consider exported nodes
    if (!this.isNodeExported(node)) {
      return;
    }

    if (
      (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      node.name
    ) {
      // This is a top level class, get its symbol
      const symbol = this.checker?.getSymbolAtLocation(node.name);
      console.log('node A', ts.SyntaxKind[node.kind]);
      if (symbol) {
        output?.push(this.serializeClass.bind(this)(symbol, node));
      }
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if (ts.isModuleDeclaration(node)) {
      // This is a namespace, visit its children
      console.log('node B', ts.SyntaxKind[node.kind]);
      ts.forEachChild(node, this.visit.bind(this));
    } else if (
      ts.SyntaxKind.EndOfFileToken !== node.kind &&
      ts.SyntaxKind.FirstStatement !== node.kind
    ) {
      if (ts.isFunctionDeclaration(node)) {
        const symbol = this.checker?.getSymbolAtLocation(node.name!);
        console.log('node C', ts.SyntaxKind[node.kind]);
        if (symbol) {
          output?.push(this.serializeClass.bind(this)(symbol, node));
        }
      } else {
        console.log('node D', ts.SyntaxKind[node.kind]);
        ts.forEachChild(node, this.visit.bind(this));
      }
    }
  }

  /** Serialize a symbol into a json object */
  serializeSymbol(symbol?: ts.Symbol, node?: ts.Node): DocEntry {
    console.log('symbol', symbol);
    const classDeclaration = node as ts.ClassDeclaration;
    const _extends = classDeclaration?.heritageClauses?.map((clause) => {
      return clause.types.map((type) => {
        // return this.checker?.getTypeAtLocation(type.expression)?.symbol?.name;
        return this.serializeSymbol.bind(this)(
          this.checker?.getSymbolAtLocation(type.expression),
          type.expression
        );
      });
    });
    console.log('_extends', _extends);
    const members: Array<DocEntry> = [];
    symbol?.members?.forEach((value, key) => {
      members.push(this.serializeSymbol.bind(this)(value, node));
    });
    let type = symbol
      ? this.checker?.typeToString(
          this.checker?.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration!
          )
        )
      : undefined;
    let name = symbol?.getName();
    if (name === 'default' && type?.includes('typeof ')) {
      name = type.replace('typeof ', '');
      type = 'class';
    }
    const documentation = symbol
      ? ts.displayPartsToString(symbol.getDocumentationComment(this.checker))
      : undefined;
    const entry: DocEntry = {
      //   modifiers:
      //     node && ts.canHaveModifiers(node)
      //       ? (ts.getModifiers(node) as any)
      //       : undefined,
      name,
      type,
      documentation,
      members,
      extends: _extends?.flat(),
    };
    if (entry?.members?.length === 0) delete entry?.members;
    if (!entry?.documentation || entry?.documentation?.length === 0)
      delete entry?.documentation;
    return entry;
  }

  /** Serialize a class symbol information */
  serializeClass(symbol: ts.Symbol, node?: ts.Node) {
    const details = this.serializeSymbol.bind(this)(symbol, node);

    // Get the construct signatures
    const constructorType = this.checker?.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );
    details.constructors = constructorType
      ?.getConstructSignatures()
      ?.map((symbol) => this.serializeSignature.bind(this)(symbol, node));

    return details;
  }

  /** Serialize a signature (call or construct) */
  serializeSignature(signature: ts.Signature, node?: ts.Node) {
    // console.log('signature', signature);

    return {
      parameters: signature.parameters.map((symbol) =>
        this.serializeSymbol.bind(this)(symbol, node)
      ),
      returnType: this.checker?.typeToString(signature.getReturnType()),
      documentation: ts.displayPartsToString(
        signature.getDocumentationComment(this.checker)
      ),
    };
  }
  /** True if this is visible outside this file, false otherwise */
  isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) &
        ts.ModifierFlags.Export) !==
        0 ||
      (!!node?.parent && node?.parent?.kind === ts.SyntaxKind.SourceFile)
    );
  }
}

export { Doc, DocEntry };
