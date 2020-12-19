'use strict';

const {
  Lexer,
  Token,
  TokenPrecedence,
} = require('./lexer');
const { createError } = require('./util');

class Parser extends Lexer {
  constructor(source, specifier) {
    super(source);
    this.specifier = specifier;
    this.insideMacro = false;
    this.isTopLevel = true;
  }

  static parse(source, specifier) {
    const p = new Parser(source, specifier);
    return p.parseProgram();
  }

  raise(message, context = this.peek()) {
    if (context.type === Token.EOS && message === 'Unexpected token') {
      message = 'Unexpected end of source';
    }

    let line;
    let startColumn;
    let endColumn;

    if (typeof context === 'number' || context.type === Token.EOS) {
      line = this.line;
      let startIndex = typeof context === 'number' ? context : context.startIndex;
      if (startIndex === this.source.length) {
        while (this.source[startIndex - 1] === '\n') {
          line -= 1;
          startIndex -= 1;
        }
        startColumn = startIndex - this.source.lastIndexOf('\n', startIndex - 1);
      } else {
        startColumn = startIndex - this.columnOffset + 1;
      }
      endColumn = startColumn + 1;
    } else if (context.location) {
      line = context.location.start.line;
      startColumn = context.location.start.column;
      endColumn = context.location.end.column;
    } else {
      ({
        line,
        column: startColumn,
        endColumn,
      } = context);
    }

    throw createError(SyntaxError, this.source, {
      start: {
        line,
        column: startColumn,
      },
      end: {
        line,
        column: endColumn,
      },
    }, this.specifier, message);
  }

  unexpected(context) {
    this.raise('Unexpected token', context);
  }

  startNode(inheritStart = undefined) {
    this.peek();
    return {
      type: undefined,
      location: {
        startIndex: inheritStart
          ? inheritStart.location.startIndex
          : this.peekedToken.startIndex,
        endIndex: -1,
        start: inheritStart ? { ...inheritStart.location.start } : {
          line: this.peekedToken.line,
          column: this.peekedToken.column,
        },
        end: {
          line: -1,
          column: -1,
        },
      },
    };
  }

  finishNode(node, type) {
    node.type = type;
    node.location.endIndex = this.currentToken.endIndex;
    node.location.end.line = this.currentToken.endLine;
    node.location.end.column = this.currentToken.endColumn;
    return node;
  }

  // Program :
  //   StatementList
  parseProgram() {
    const node = this.startNode();
    node.statements = this.parseStatementList(Token.EOS);
    return this.finishNode(node, 'Program');
  }

  // StatementList :
  //   Statement
  //   StatementList Statement
  parseStatementList(end) {
    const statements = [];
    while (!this.eat(end)) {
      statements.push(this.parseStatement(end));
    }
    return statements;
  }

  // Statement :
  //   ImportDeclaration
  //   LocalDeclaration
  //   MacroDeclaration
  //   Assignment
  //   If
  //   Block
  //   Expression `;`
  parseStatement(end) {
    switch (this.peek().type) {
      case Token.IMPORT:
        return this.parseImportDeclaration();
      case Token.LET:
        return this.parseLocalDeclaration();
      case Token.ALIAS:
        return this.parseAliasDeclaration();
      case Token.EXPORT:
      case Token.MACRO:
        if (this.insideMacro) {
          this.raise('Cannot declare macro inside macro');
        }
        return this.parseMacroDeclaration();
      case Token.IF: {
        const expr = this.parseIf();
        expr.statement = true;
        return expr;
      }
      case Token.LBRACE: {
        const expr = this.parseBlock();
        expr.statement = true;
        return expr;
      }
      default: {
        const expr = this.parseExpression();
        if ((expr.type === 'SimVar' || expr.type === 'Identifier')
            && TokenPrecedence[this.peek().type] === TokenPrecedence.ASSIGN) {
          return this.parseAssignment(expr);
        }
        if (this.eat(Token.SEMICOLON)) {
          return expr;
        }
        if (end === Token.EOS || !this.test(end)) {
          // custom line/column for exact positioning of caret
          this.raise('Expected semicolon after expression', {
            line: expr.location.end.line,
            column: expr.location.end.column,
            endColumn: expr.location.end.column + 1,
          });
        }
        expr.hasSemicolon = false;
        return expr;
      }
    }
  }

  // ImportDeclaration :
  //   `import` `{` names `}` from StringLiteral `;`
  parseImportDeclaration() {
    const node = this.startNode();
    this.expect(Token.IMPORT);
    this.expect(Token.LBRACE);
    node.imports = [];
    while (!this.eat(Token.RBRACE)) {
      node.imports.push(this.parseIdentifier());
      if (this.eat(Token.RBRACE)) {
        break;
      }
      this.expect(Token.COMMA);
    }
    this.expect(Token.FROM);
    node.specifier = this.parseStringLiteral();
    this.expect(Token.SEMICOLON);
    return this.finishNode(node, 'ImportDeclaration');
  }

  // LocalDeclaration :
  //   `let` Identifier `=` Expression `;`
  parseLocalDeclaration() {
    const node = this.startNode();
    this.expect(Token.LET);
    node.name = this.parseIdentifier();
    this.expect(Token.ASSIGN);
    node.value = this.parseExpression();
    this.expect(Token.SEMICOLON);
    return this.finishNode(node, 'LocalDeclaration');
  }

  // AliasDeclaration :
  //   `alias` Identifier `=` SimVar `;`
  parseAliasDeclaration() {
    const node = this.startNode();
    this.expect(Token.ALIAS);
    node.name = this.parseIdentifier();
    this.expect(Token.ASSIGN);
    node.simvar = this.parseSimVar();
    if (!node.simvar.value.type) {
      this.raise('Aliased simvars must have a unit', node.simvar);
    }
    this.expect(Token.SEMICOLON);
    return this.finishNode(node, 'AliasDeclaration');
  }

  // MacroDeclaration :
  //   `export`? `macro` Identifier `(` Parameters `)` Block
  parseMacroDeclaration() {
    const node = this.startNode();
    node.isExported = this.isTopLevel && this.eat(Token.EXPORT);
    this.expect(Token.MACRO);
    node.name = this.parseIdentifier();
    this.expect(Token.LPAREN);
    node.parameters = [];
    while (true) { // eslint-disable-line no-constant-condition
      if (this.eat(Token.RPAREN)) {
        break;
      }
      node.parameters.push(this.parseMacroIdentifier());
      if (this.eat(Token.RPAREN)) {
        break;
      }
      this.expect(Token.COMMA);
    }
    this.insideMacro = true;
    node.body = this.parseBlock();
    this.insideMacro = false;
    return this.finishNode(node, 'MacroDeclaration');
  }

  // Assignment :
  //   SimVar = Expression `;`
  //   Identifier = Expression `;`
  //   SimVar @= Expression `;`
  //   Identifier @= Expression `;`
  parseAssignment(left) {
    const node = this.startNode(left);
    node.left = left;
    if (this.eat(Token.ASSIGN)) {
      node.right = this.parseExpression();
    } else {
      const binop = this.startNode(left);
      binop.left = left;
      binop.operator = this.next().value.slice(0, -1);
      binop.right = this.parseExpression();
      node.right = this.finishNode(binop, 'BinaryExpression');
    }
    this.expect(Token.SEMICOLON);
    return this.finishNode(node, 'Assignment');
  }

  // Expression :
  //   AssignmentExpression
  parseExpression() {
    return this.parseBinaryExpression(TokenPrecedence.OR);
  }

  // BinaryExpression :
  //   a lot of rules ok
  parseBinaryExpression(precedence, initialX = this.parseUnaryExpression()) {
    let p = TokenPrecedence[this.peek().type];
    let x = initialX;
    if (p >= precedence) {
      do {
        while (TokenPrecedence[this.peek().type] === p) {
          const node = this.startNode(x);
          node.left = x;
          node.operator = this.next().value;
          node.right = this.parseBinaryExpression(p + 1);
          x = this.finishNode(node, 'BinaryExpression');
        }
        p -= 1;
      } while (p >= precedence);
    }
    return x;
  }

  // UnaryExpression :
  //   MethodExpression
  //   `!` UnaryExpression
  //   `~` UnaryExpression
  //   `-` UnaryExpression
  parseUnaryExpression() {
    const node = this.startNode();
    switch (this.peek().type) {
      case Token.NOT:
      case Token.BIT_NOT:
      case Token.SUB:
        node.operator = this.next().value;
        node.operand = this.parseUnaryExpression();
        return this.finishNode(node, 'UnaryExpression');
      default:
        return this.parseMethodExpression();
    }
  }

  // MethodExpression
  //   MacroExpansion
  //   MethodExpression `.` Identifier `(` Arguments `)`
  parseMethodExpression() {
    let left = this.parseMacroExpansion();
    while (this.eat(Token.PERIOD)) {
      const node = this.startNode(left);
      node.target = left;
      node.callee = this.parseIdentifier();
      node.arguments = this.parseArguments();
      left = this.finishNode(node, 'MethodExpression');
    }
    return left;
  }

  // MacroExpansion :
  //   PrimaryExpression
  //   Identifier `(` Arguments `)`
  parseMacroExpansion() {
    const left = this.parsePrimaryExpression();
    if (left.type === 'Identifier' && this.test(Token.LPAREN)) {
      const node = this.startNode(left);
      node.name = left;
      node.arguments = this.parseArguments();
      return this.finishNode(node, 'MacroExpansion');
    }
    return left;
  }

  // Arguments :
  //   `(` ArgumentList `,`? `)`
  // ArgumentList :
  //   Expression
  //   ArgumentList `,` Expression
  parseArguments() {
    const startParen = this.expect(Token.LPAREN);
    const args = [];
    while (!this.test(Token.RPAREN)) {
      args.push(this.parseExpression());
      if (this.test(Token.RPAREN)) {
        break;
      }
      this.expect(Token.COMMA);
    }
    const endParen = this.expect(Token.RPAREN);
    args.location = {
      start: {
        line: startParen.line,
        column: startParen.column,
      },
      end: {
        line: endParen.endLine,
        column: endParen.endColumn,
      },
    };
    return args;
  }

  // PrimaryExpression :
  //   Identifier
  //   BooleanLiteral
  //   NumberLiteral
  //   StringLiteral
  //   `(` Expression `)`
  //   SimVar
  //   If
  parsePrimaryExpression() {
    switch (this.peek().type) {
      case Token.IDENTIFIER:
        return this.parseIdentifier();
      case Token.MACRO_IDENTIFIER:
        if (!this.insideMacro) {
          this.unexpected();
        }
        return this.parseMacroIdentifier();
      case Token.TRUE:
      case Token.FALSE: {
        const node = this.startNode();
        node.value = this.next().value === 'true';
        return this.finishNode(node, 'BooleanLiteral');
      }
      case Token.NUMBER: {
        const node = this.startNode();
        node.value = this.next().value;
        return this.finishNode(node, 'NumberLiteral');
      }
      case Token.STRING:
        return this.parseStringLiteral();
      case Token.LPAREN: {
        this.next();
        const node = this.parseExpression();
        this.expect(Token.RPAREN);
        return node;
      }
      case Token.SIMVAR:
        return this.parseSimVar();
      case Token.IF:
        return this.parseIf();
      case Token.LBRACE:
        return this.parseBlock();
      default:
        return this.unexpected();
    }
  }

  // Identifier :
  //   ID_Start ID_Continue*
  parseIdentifier() {
    const node = this.startNode();
    node.value = this.expect(Token.IDENTIFIER).value;
    return this.finishNode(node, 'Identifier');
  }

  // MacroIdentifier :
  //   `$` ID_Continue*
  parseMacroIdentifier() {
    const node = this.startNode();
    node.value = this.expect(Token.MACRO_IDENTIFIER).value;
    return this.finishNode(node, 'MacroIdentifier');
  }

  // SimVar :
  //   `(` any char `:` any chars `)`
  parseSimVar() {
    const node = this.startNode();
    node.value = this.expect(Token.SIMVAR).value;
    return this.finishNode(node, 'SimVar');
  }

  // StringLiteral :
  //   `'` any chars `'`
  parseStringLiteral() {
    const node = this.startNode();
    node.value = this.expect(Token.STRING).value;
    return this.finishNode(node, 'StringLiteral');
  }

  // If :
  //   `if` Expression Block [lookahead != `else`]
  //   `if` Expression Block `else` Block
  //   `if` Expression Block If
  parseIf() {
    const node = this.startNode();
    this.expect(Token.IF);
    node.statement = false;
    node.test = this.parseExpression();
    node.consequent = this.parseBlock();
    if (this.eat(Token.ELSE)) {
      node.alternative = this.test(Token.IF)
        ? { // wrap in block for assembler formatting
          type: 'Block',
          statement: false,
          statements: [this.parseIf()],
        }
        : this.parseBlock();
    } else {
      node.alternative = null;
    }
    return this.finishNode(node, 'If');
  }

  // Block :
  //   `{` StatementList `}`
  parseBlock() {
    const node = this.startNode();
    this.expect(Token.LBRACE);
    node.statement = false;
    const oldToplevel = this.isTopLevel;
    this.isTopLevel = false;
    node.statements = this.parseStatementList(Token.RBRACE);
    this.isTopLevel = oldToplevel;
    return this.finishNode(node, 'Block');
  }
}

module.exports = { Parser };
