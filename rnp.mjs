/*!
 * @flybywiresim/rnp 2.1.0
 *
 * MIT License
 * 
 * Copyright (c) 2020 RNP Contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

const kMessage = Symbol('kMessage');

function createMessage$1(source, location, specifier, message) {
  if (location.start.line === location.end.line) {
    const offset = location.start.column - 1;
    const length = location.end.column - location.start.column;
    const pad = ' '.repeat(String(location.start.line).length);
    return `\
${pad}--> ${specifier}:${location.start.line}:${location.start.column}
${pad} |
${location.start.line} | ${source.split('\n')[location.start.line - 1]}
${pad} | ${' '.repeat(offset)}${'^'.repeat(length)} ${message}
${pad} |`;
  }

  const lines = source
    .split('\n')
    .slice(location.start.line - 1, location.end.line);

  const lineNumMaxWidth = String(location.end.line).length;
  const pad = ' '.repeat(lineNumMaxWidth);

  const mapped = lines
    .map((line, index) => {
      const lineNum = location.start.line + index;
      const start = `${lineNum.toString().padStart(lineNumMaxWidth, ' ')} | `;
      if (index === 0) {
        if (location.start.column === 1) {
          return `${start}/ ${line}`;
        }
        return `${start}  ${line}\n${pad} | --${'-'.repeat(location.start.column - 1)}^`;
      }
      if (index === lines.length - 1) {
        return `${start}| ${line}\n${pad} | |_${'_'.repeat(Math.max(location.end.column - 2, 0))}^ ${message}`;
      }
      return `${start}| ${line}`;
    })
    .join('\n');

  return `\
${pad}--> ${specifier}:${location.start.line}:${location.start.column}
${pad} |
${mapped}
${pad} |`;
}

function createError$2(T, source, location, specifier, message) {
  const payload = {
    message,
    location,
    detail: createMessage$1(source, location, specifier, message),
  };
  const e = new T(message);
  const oldPST = Error.prepareStackTrace;
  Error.prepareStackTrace = (error, trace) => `    at ${trace.join('\n    at ')}`;
  e.stack = `\
${e.name}: ${e.message}
${payload.detail}
${e.stack}`;
  Error.prepareStackTrace = oldPST;
  e[kMessage] = payload;
  return e;
}

var util = { createError: createError$2, createMessage: createMessage$1, kMessage };

class Type$1 {
  constructor(name) {
    this.name = name.toLowerCase();
  }

  toString() {
    return this.name;
  }
}

[
  'ANY',
  'BOOLEAN',
  'NUMBER',
  'STRING',
  'VOID',
].forEach((t) => {
  Type$1[t] = new Type$1(t);
});

// https://www.prepar3d.com/SDKv5/sdk/references/variables/units_of_measurement.html
const SimVarTypes$1 = {
  bool: Type$1.BOOLEAN,
  boolean: Type$1.BOOLEAN,
  number: Type$1.NUMBER,
  string: Type$1.STRING,
};

// All the number types
[
  // Distance
  'meters',
  'centimeters',
  'kilometers',
  'millimeters',
  'miles',
  'decimiles',
  'nautical miles',
  'feet',
  'inches',
  'yards',
  // Area
  'square inches',
  'square feet',
  'square yards',
  'square meters',
  'square centimeters',
  'square kilometers',
  'square millimeters',
  'square miles',
  // Volume
  'cubic inches',
  'cubic feet',
  'cubic yards',
  'cubic miles',
  'cubic milimeters',
  'cubic centimeters',
  'cubic meters',
  'cubic kilometers',
  'liters',
  'gallons',
  'quarts',
  // Temperature
  'kelvin',
  'rankine',
  'fahrenheit',
  'celsius',
  // Angle
  'radians',
  'rounds',
  'degrees',
  'degree latitude',
  'degree longitude',
  'grads',
  // Global Position
  'degrees latitude',
  'degrees longitude',
  'meters latitude',
  // Angular Velocity
  'radians per second',
  'revolutions per minute',
  'minutes per round',
  'nice minutes per round',
  'degrees per second',
  // Speed
  'meters per second',
  'meters per minute',
  'feet per second',
  'feet per minute',
  'kph',
  'knots',
  'mph',
  'machs',
  // Acceleration
  'meters per second squared',
  'g force',
  'feet per second squared',
  // Time
  'seconds',
  'minutes',
  'hours',
  'days',
  'hours over 10',
  // Power
  'watts',
  'ft lb per second',
  'horsepower',
  // Volume Rate
  'meters cubed per second',
  'gallons per hour',
  'liters per hour',
  // Weight
  'kilograms',
  'geepounds',
  'pounds',
  // Weight Rate
  'kilograms per second',
  'pounds per hour',
  'pounds per second',
  // Electrical Current
  'amps',
  // Electrical Potential
  'volts',
  // Frequency
  'hz',
  'khz',
  'mhz',
  // Density
  'kilograms per cubic meter',
  'slugs per cubic foot',
  'pounds per gallon',
  // Pressure
  'pascals',
  'newtons per square meter',
  'kpa',
  'kilogram force per square centimeter',
  'mmHg',
  'cmHg',
  'inHg',
  'atm',
  'psi',
  'millimeters of water',
  'bars',
  // Torque
  'newton meter',
  'foot-pounds',
  // Misc
  'part',
  'half',
  'third',
  'percent',
  'percent over 100',
  'decibels',
  'position 16k',
  'position 32k',
  'enum',
].forEach((n) => {
  SimVarTypes$1[n] = Type$1.NUMBER;
});

var type = {
  Type: Type$1,
  SimVarTypes: SimVarTypes$1,
};

const IDENT_START_RE = /\p{ID_Start}/u;
const IDENT_CONTINUE_RE = /\p{ID_Continue}/u;

const isIDStart = (c) => c && IDENT_START_RE.test(c);
const isIDContinue = (c) => c && IDENT_CONTINUE_RE.test(c);

const Token$1 = {};
const TokenNames = {};
const TokenValues = {};
const TokenPrecedence$1 = {};
const OperatorOverload$1 = {};
const Keywords = Object.create(null);

const LexTree = {};

const MaybeAssignTokens = [
  // Logical
  ['OR', 'or', 4],
  ['AND', 'and', 5],

  // Binop
  ['BIT_OR', '|', 6],
  ['BIT_XOR', '^', 7],
  ['BIT_AND', '&', 8],
  ['SHL', '<<', 11],
  ['SAR', '>>', 11],
  ['MUL', '*', 13],
  ['DIV', '/', 13],
  ['IDIV', 'idiv', 13, 'div'],
  ['MOD', '%', 13],
  ['EXP', '**', 14, 'pow'],

  // Unop
  ['ADD', '+', 12],
  ['SUB', '-', 12],
];

[
  ['ASSIGN', '=', 2],
  ...MaybeAssignTokens.map((t) => [`ASSIGN_${t[0]}`, `${t[1]}=`, 2]),

  // Relational
  ['EQ', '==', 9],
  ['NE', '!=', 9],
  ['LT', '<', 10],
  ['GT', '>', 10],
  ['LTE', '<=', 10],
  ['GTE', '>=', 10],

  ...MaybeAssignTokens,

  // Operators
  ['NOT', '!'],
  ['BIT_NOT', '~'],

  // Keywords
  ['IF', 'if'],
  ['ELSE', 'else'],
  ['LET', 'let'],
  ['ALIAS', 'alias'],
  ['MACRO', 'macro'],
  ['TRUE', 'true'],
  ['FALSE', 'false'],
  ['IMPORT', 'import'],
  ['EXPORT', 'export'],
  ['FROM', 'from'],

  // Other
  ['NUMBER', null],
  ['STRING', null],
  ['IDENTIFIER', null],
  ['MACRO_IDENTIFIER', null],
  ['SIMVAR', null],
  ['TEMPLATE', null],
  ['EOS', null],

  ['COMMA', ','],
  ['SEMICOLON', ';'],
  ['LPAREN', '('],
  ['RPAREN', ')'],
  ['LBRACE', '{'],
  ['RBRACE', '}'],
  ['PERIOD', '.'],
].forEach(([name, v, prec, overload], i) => {
  Token$1[name] = i;
  TokenNames[i] = name;
  TokenValues[i] = v;
  TokenPrecedence$1[name] = prec || 0;
  TokenPrecedence$1[i] = TokenPrecedence$1[name];
  if (name.toLowerCase() === v) {
    Keywords[v] = i;
  }

  if (overload) {
    OperatorOverload$1[v] = overload;
  }

  if (v) {
    let t = LexTree;
    for (let n = 0; n < v.length; n += 1) {
      t[v[n]] = t[v[n]] || {};
      t = t[v[n]];
    }
    t.value = i;
  }
});

class Lexer$1 {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.currentToken = undefined;
    this.peekedToken = undefined;
    this.scannedValue = undefined;
    this.line = 1;
    this.columnOffset = 0;
    this.positionForNextToken = 0;
    this.lineForNextToken = 0;
    this.columnForNextToken = 0;
  }

  next() {
    this.currentToken = this.peekedToken;
    this.peekedToken = this.advance();
    return this.currentToken;
  }

  peek() {
    if (this.peekedToken === undefined) {
      this.next();
    }
    return this.peekedToken;
  }

  test(t) {
    return this.peek().type === t;
  }

  eat(t) {
    if (this.test(t)) {
      this.next();
      return true;
    }
    return false;
  }

  expect(t) {
    if (this.test(t)) {
      return this.next();
    }
    return this.unexpected();
  }

  skipLineComment() {
    while (this.position < this.source.length) {
      this.position += 1;
      if (this.source[this.position - 1] === '\n') {
        this.line += 1;
        this.columnOffset = this.position;
        return;
      }
    }
  }

  skipBlockComment() {
    let n = 0;
    do {
      if (this.position >= this.source.length) {
        this.raise('Unterminated block comment', this.position);
      }
      switch (this.source[this.position]) {
        case '/':
          this.position += 1;
          if (this.source[this.position] === '*') {
            this.position += 1;
            n += 1;
          }
          break;
        case '*':
          this.position += 1;
          if (this.source[this.position] === '/') {
            this.position += 1;
            n -= 1;
          }
          break;
        default:
          if (this.source[this.position] === '\n') {
            this.line += 1;
            this.columnOffset = this.position;
          }
          this.position += 1;
          break;
      }
    } while (n > 0);
  }

  skipWhitespace() {
    while (this.position < this.source.length) {
      switch (this.source[this.position]) {
        case ' ':
        case '\t':
          this.position += 1;
          break;
        case '\n':
          this.position += 1;
          this.line += 1;
          this.columnOffset = this.position;
          break;
        case '/':
          if (this.source[this.position + 1] === '*') {
            this.skipBlockComment();
          } else if (this.source[this.position + 1] === '/') {
            this.skipLineComment();
          } else {
            return;
          }
          break;
        default:
          return;
      }
    }
  }

  advance() {
    const type = this.scan();
    const value = this.scannedValue;
    this.scannedValue = undefined;
    return {
      type,
      value,
      startIndex: this.positionForNextToken,
      endIndex: this.position,
      line: this.lineForNextToken,
      column: this.columnForNextToken,
      endLine: this.line,
      endColumn: this.position - this.columnOffset + 1,
    };
  }

  scan() {
    this.skipWhitespace();

    this.positionForNextToken = this.position;
    this.lineForNextToken = this.line;
    this.columnForNextToken = this.position - this.columnOffset + 1;

    if (this.position >= this.source.length) {
      return Token$1.EOS;
    }

    switch (this.source[this.position]) {
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        return this.scanNumber();
      case '\'':
        return this.scanString();
      case '(':
        this.position += 1;
        if (this.source[this.position + 1] === ':') {
          return this.scanSimVar();
        }
        return Token$1.LPAREN;
      case '#':
        return this.scanTemplate();
      default: {
        const start = this.position;
        if (isIDStart(this.source[this.position]) || this.source[this.position] === '$') {
          this.position += 1;
          while (isIDContinue(this.source[this.position])) {
            this.position += 1;
          }
          this.scannedValue = this.source.slice(start, this.position);
          if (Keywords[this.scannedValue]) {
            return Keywords[this.scannedValue];
          }
          return this.scannedValue.startsWith('$')
            ? Token$1.MACRO_IDENTIFIER
            : Token$1.IDENTIFIER;
        }
        if (this.source[this.position] === '-'
            && /\d/.test(this.source[this.position + 1])) {
          return this.scanNumber();
        }
        let match = LexTree[this.source[this.position]];
        if (match) {
          this.position += 1;
          while (match[this.source[this.position]]) {
            match = match[this.source[this.position]];
            this.position += 1;
          }
          this.scannedValue = TokenValues[match.value];
          return match.value;
        }
        return this.unexpected(this.position);
      }
    }
  }

  scanNumber() {
    const start = this.position;
    if (this.source[this.position] === '-') {
      this.position += 1;
    }
    let base = 10;
    if (this.source[this.position] === '0') {
      this.position += 1;
      switch (this.source[this.position]) {
        case 'x':
          this.position += 1;
          base = 16;
          break;
        case 'o':
          this.position += 1;
          base = 8;
          break;
        case 'b':
          this.position += 1;
          base = 2;
          break;
        case '.':
          break;
        default:
          this.scannedValue = 0;
          return Token$1.NUMBER;
      }
    }
    const check = {
      16: (c) => c && /[\da-f]/u.test(c),
      10: (c) => c && /\d/u.test(c),
      8: (c) => c && /[0-7]/u.test(c),
      2: (c) => c && /[01]/u.test(c),
    }[base];
    while (this.position < this.source.length) {
      if (check(this.source[this.position])) {
        this.position += 1;
      } else {
        break;
      }
    }
    if (base === 10 && this.source[this.position] === '.'
        && check(this.source[this.position + 1])) {
      this.position += 1;
      while (this.position < this.source.length) {
        if (check(this.source[this.position])) {
          this.position += 1;
        } else {
          break;
        }
      }
    }
    const buffer = this.source.slice(base === 10 ? start : start + 2, this.position);
    this.scannedValue = base === 10
      ? Number.parseFloat(buffer, base)
      : Number.parseInt(buffer, base);
    return Token$1.NUMBER;
  }

  scanString() {
    this.position += 1;
    let buffer = '';
    while (true) { // eslint-disable-line no-constant-condition
      if (this.position >= this.source.length) {
        this.raise('Unterminated string', this.position);
      }
      const c = this.source[this.position];
      if (c === '\'') {
        this.position += 1;
        break;
      }
      if (c === '\n') {
        this.raise('Unterminated string', this.position);
      }
      this.position += 1;
      buffer += c;
    }
    this.scannedValue = buffer;
    return Token$1.STRING;
  }

  scanSimVar() {
    const nameStart = this.position;
    let typeStart = -1;
    while (true) { // eslint-disable-line no-constant-condition
      if (this.position >= this.source.length || this.source[this.position] === '\n') {
        this.raise('Unexpected end of simvar', this.position);
      }
      if (typeStart === -1 && this.source[this.position] === ',') {
        typeStart = this.position;
      }
      if (this.source[this.position] === ')') {
        break;
      }
      this.position += 1;
    }
    this.position += 1;
    const name = this.source
      .slice(nameStart, typeStart === -1 ? this.position - 1 : typeStart)
      .trim();
    const type = typeStart === -1
      ? null
      : this.source.slice(typeStart + 1, this.position - 1).trim();
    this.scannedValue = { name, type };
    return Token$1.SIMVAR;
  }

  scanTemplate() {
    this.position += 1;
    const nameStart = this.position;
    let typeStart = -1;
    while (true) { // eslint-disable-line no-constant-condition
      if (this.position >= this.source.length || this.source[this.position] === '\n') {
        this.raise('Unexpected end of template', this.position);
      }
      if (typeStart === -1 && this.source[this.position] === ',') {
        typeStart = this.position;
      }
      if (this.source[this.position] === '#') {
        break;
      }
      this.position += 1;
    }
    this.position += 1;
    const name = this.source
      .slice(nameStart, typeStart === -1 ? this.position - 1 : typeStart)
      .trim();
    const type = typeStart === -1
      ? null
      : this.source.slice(typeStart + 1, this.position - 1).trim();
    this.scannedValue = { name, type };
    return Token$1.TEMPLATE;
  }
}

var lexer = {
  Lexer: Lexer$1,
  Token: Token$1,
  TokenPrecedence: TokenPrecedence$1,
  TokenNames,
  OperatorOverload: OperatorOverload$1,
};

const {
  Lexer,
  Token,
  TokenPrecedence,
} = lexer;
const { createError: createError$1 } = util;

class Parser$1 extends Lexer {
  constructor(source, specifier) {
    super(source);
    this.specifier = specifier;
    this.insideMacro = false;
    this.isTopLevel = true;
  }

  static parse(source, specifier) {
    const p = new Parser$1(source, specifier);
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

    throw createError$1(SyntaxError, this.source, {
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
          if (expr.type === 'Template') {
            expr.statement = true;
          }
          return expr;
        }
        if (!this.test(end)) {
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
      case Token.TEMPLATE:
        return this.parseTemplate();
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
  //   `(` any char `:` any chars `,` any chars `)`
  parseSimVar() {
    const node = this.startNode();
    node.value = this.expect(Token.SIMVAR).value;
    return this.finishNode(node, 'SimVar');
  }

  // Template :
  //   `#` any char `#`
  //   `#` any char `,` any char `#`
  parseTemplate() {
    const node = this.startNode();
    node.statement = false;
    node.value = this.expect(Token.TEMPLATE).value;
    return this.finishNode(node, 'Template');
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

var parser = { Parser: Parser$1 };

const { OperatorOverload } = lexer;
const { Parser } = parser;
const { createError, createMessage } = util;
const { Type, SimVarTypes } = type;

const OpTypes = {
  '+': [Type.NUMBER, Type.NUMBER],
  '-': [Type.NUMBER, Type.NUMBER],
  '/': [Type.NUMBER, Type.NUMBER],
  'idiv': [Type.NUMBER, Type.NUMBER],
  '*': [Type.NUMBER, Type.NUMBER],
  '%': [Type.NUMBER, Type.NUMBER],
  '**': [Type.NUMBER, Type.NUMBER],
  // == and != can be applied to number and string
  // '==': [Type.NUMBER, Type.BOOLEAN],
  // '!=': [Type.NUMBER, Type.BOOLEAN],
  '>': [Type.NUMBER, Type.BOOLEAN],
  '<': [Type.NUMBER, Type.BOOLEAN],
  '>=': [Type.NUMBER, Type.BOOLEAN],
  '<=': [Type.NUMBER, Type.BOOLEAN],
  '&': [Type.NUMBER, Type.NUMBER],
  '|': [Type.NUMBER, Type.NUMBER],
  '^': [Type.NUMBER, Type.NUMBER],
  '~': [Type.NUMBER, Type.NUMBER],
  '>>': [Type.NUMBER, Type.NUMBER],
  '<<': [Type.NUMBER, Type.NUMBER],
  '!': [Type.BOOLEAN, Type.BOOLEAN],
  'and': [Type.BOOLEAN, Type.BOOLEAN],
  'or': [Type.BOOLEAN, Type.BOOLEAN],
};

const formatSimVar = (s) => {
  if (s.type) {
    return `${s.name}, ${s.type}`;
  }
  return `${s.name}`;
};

const REGISTER_MAX = 50;

class Assembler {
  constructor(expectedReturnType, source, specifier, getSource) {
    this.source = source;
    this.expectedReturnType = expectedReturnType;
    this.specifier = specifier;
    this.getSource = getSource;
    this.warnings = [];
    this.stack = [];
    this.scope = null;
    this.registerIndex = 0;
    this.exports = new Map();

    this.indent = 0;
    this.lines = [];
    this.output = [];
  }

  static assemble(ast, ...args) {
    const a = new Assembler(...args);
    a.visit(ast);
    return {
      warnings: a.warnings,
      output: a.getOutput(),
    };
  }

  raise(T, message, context) {
    throw createError(T, this.source, context.location, this.specifier, message);
  }

  warn(message, context) {
    const detail = createMessage(this.source, context.location, this.specifier, message);
    this.warnings.push({ detail, message, location: context.location });
  }

  emit(s) {
    this.output.push(s);
  }

  line() {
    if (this.output.length > 0) {
      this.lines.push('  '.repeat(this.indent) + this.output.join(' '));
    }
    this.output = [];
  }

  getOutput() {
    return this.lines.join('\n');
  }

  push(t) {
    /* istanbul ignore next */
    if (t === Type.VOID) {
      throw new RangeError('tried to push void');
    }
    this.stack.push(t);
  }

  pop() {
    return this.stack.pop() || Type.VOID;
  }

  pushScope() {
    const scope = {
      locals: new Map(),
      startIndex: this.registerIndex,
      outer: this.scope,
    };
    this.scope = scope;
  }

  popScope() {
    const { scope } = this;
    this.scope = scope.outer;
    this.registerIndex = scope.startIndex;
  }

  declare(name, data) {
    if (this.resolve(name) !== null) {
      return false;
    }
    this.scope.locals.set(name, data);
    return true;
  }

  resolve(name) {
    for (let s = this.scope; s !== null; s = s.outer) {
      if (s.locals.has(name)) {
        return s.locals.get(name);
      }
    }
    return null;
  }

  visit(node) {
    this[`visit${node.type}`](node);
  }

  visitStatementList(statements) {
    statements.forEach((s) => {
      this.visit(s);
      if (s.hasSemicolon !== false) {
        const t0 = this.pop();
        if (t0 !== Type.VOID) {
          this.warn('Unused value', s);
          this.emit('p');
        }
      }
      this.line();
    });
  }

  visitProgram(node) {
    this.pushScope();
    this.visitStatementList(node.statements);
    this.popScope();
    const t0 = this.pop();
    if (t0 !== this.expectedReturnType) {
      this.raise(
        TypeError,
        `Program expected ${this.expectedReturnType} but got ${t0}`,
        node.statements.length > 0 ? node.statements[node.statements.length - 1] : node,
      );
    }
  }

  visitImportDeclaration(node) {
    let resolved = null;
    if (this.getSource) {
      resolved = this.getSource(this.specifier, node.specifier.value);
    }
    if (resolved === null) {
      this.raise(Error, `Could not resolve '${node.specifier.value}' from '${this.specifier}'`, node.specifier);
    }
    const { source, specifier } = resolved;
    const ast = Parser.parse(source, specifier);
    const a = new Assembler(Type.VOID, source, specifier, this.getSource);
    a.visit(ast);
    for (const i of node.imports) {
      if (!a.exports.has(i.value)) {
        this.raise(ReferenceError, `${node.specifier.value} does not export ${i.value}`, i);
      }
      if (!this.declare(i.value, a.exports.get(i.value))) {
        this.raise(SyntaxError, `Cannot shadow or redeclare ${i.value}`, i);
      }
    }
  }

  visitLocalDeclaration(node) {
    this.visit(node.value);
    const t0 = this.pop();
    if (t0 === Type.VOID) {
      this.raise(TypeError, `Expected a value but got ${t0}`, node.value);
    }
    const register = this.registerIndex;
    if (register >= REGISTER_MAX) {
      this.raise(RangeError, 'ran out of registers!!', node.name);
    }
    if (!this.declare(node.name.value, { register, type: t0 })) {
      this.raise(SyntaxError, `Cannot shadow or redeclare ${node.name.value}`, node.name);
    }
    this.registerIndex += 1;
    this.emit(`sp${register}`);
  }

  visitAliasDeclaration(node) {
    if (!this.declare(node.name.value, { alias: node.simvar })) {
      this.raise(SyntaxError, `Cannot shadow or redeclare ${node.name.value}`, node.name);
    }
  }

  visitMacroDeclaration(node) {
    if (!this.declare(node.name.value, { node, scope: this.scope })) {
      this.raise(SyntaxError, `Cannot shadow or redeclare ${node.name.value}`, node.name);
    }
    if (node.isExported) {
      this.exports.set(node.name.value, { node, scope: null });
    }
  }

  visitMacroExpansion(node) {
    const calleeScope = this.scope;

    const macro = this.resolve(node.name.value);
    if (macro === null) {
      this.raise(ReferenceError, `${node.name.value} is not declared`, node.name);
    }
    if (node.arguments.length !== macro.node.parameters.length) {
      this.raise(SyntaxError, `Expected ${macro.node.parameters.length} arguments`, node.arguments);
    }

    const savedScope = this.scope;
    this.scope = macro.scope;
    this.pushScope();

    macro.node.parameters.forEach((p, i) => {
      const a = node.arguments[i];
      if (!this.declare(p.value, { node: a, scope: calleeScope })) {
        this.raise(SyntaxError, `Cannot shadow or redeclare ${p.value}`, p);
      }
    });
    this.visit(macro.node.body);

    this.popScope();
    this.scope = savedScope;
  }

  visitMacroIdentifier(node) {
    const i = this.resolve(node.value);
    if (i === null) {
      this.raise(ReferenceError, `${node.value} is not declared`, node);
    }
    const savedScope = this.scope;
    this.scope = i.scope;
    this.visit(i.node);
    this.scope = savedScope;
  }

  visitAssignment(node) {
    this.visit(node.right);
    const t0 = this.pop();
    switch (node.left.type) {
      case 'SimVar':
        if (node.left.value.type) {
          if (t0 !== SimVarTypes[node.left.value.type]) {
            this.raise(TypeError, `Expected ${SimVarTypes[node.left.value.type]} but got ${t0}`, node.right);
          }
        } else if (t0 === Type.VOID) {
          this.raise(TypeError, `Expected a value but got ${t0}`, node.right);
        }
        this.emit(`(>${formatSimVar(node.left.value)})`);
        break;
      case 'Identifier': {
        const local = this.resolve(node.left.value);
        if (local === null) {
          this.raise(ReferenceError, `${node.left.value} is not declared`, node.left);
        }
        if (local.alias) {
          if (t0 !== SimVarTypes[local.alias.value.type]) {
            this.raise(TypeError, `Expected ${SimVarTypes[local.alias.value.type]} but got ${t0}`, node.right);
          }
          this.emit(`(>${formatSimVar(local.alias.value)})`);
        } else {
          if (t0 !== local.type) {
            this.raise(TypeError, `Expected ${local.type} but got ${t0}`, node.right);
          }
          this.emit(`sp${local.register}`);
        }
        break;
      }
      /* istanbul ignore next */
      default:
        throw new RangeError(node.left.type);
    }
  }

  visitUnaryExpression(node) {
    this.visit(node.operand);
    const [i, o] = OpTypes[node.operator];
    const t = this.pop();
    if (t !== i) {
      this.raise(TypeError, `Expected ${i} but got ${t}`, node.operand);
    }
    this.emit(OperatorOverload[node.operator] || node.operator);
    this.push(o);
  }

  visitBinaryExpression(node) {
    this.visit(node.left);
    const t1 = this.pop();
    this.visit(node.right);
    const t2 = this.pop();
    if (t1 !== t2) {
      this.raise(TypeError, `Expected both operands to be the same type but got ${t1} and ${t2}`, node);
    }
    let i;
    let o;
    switch (node.operator) {
      case '==':
      case '!=':
        if (t1 === Type.STRING) {
          i = Type.STRING;
        } else if (t1 === Type.BOOLEAN) {
          i = Type.BOOLEAN;
        } else {
          i = Type.NUMBER;
        }
        o = Type.BOOLEAN;
        break;
      default:
        ([i, o] = OpTypes[node.operator]);
        break;
    }
    if (t1 !== i) {
      // t2 does not need to be checked here because we checked that it == t1 above
      this.raise(TypeError, `Expected ${i} but got ${t1}`, node.left);
    }
    switch (node.operator) {
      case '==':
      case '!=':
        if (i === Type.STRING) {
          this.emit(`scmp 0 ${node.operator}`);
        } else {
          this.emit(node.operator);
        }
        break;
      default:
        this.emit(OperatorOverload[node.operator] || node.operator);
        break;
    }
    this.push(o);
  }

  visitMethodExpression(node) {
    const ops = {
      abs: ['abs', Type.NUMBER, [], Type.NUMBER],
      floor: ['flr', Type.NUMBER, [], Type.NUMBER],
      range: ['rng', Type.NUMBER, [Type.NUMBER, Type.NUMBER], Type.NUMBER],
      cos: ['cos', Type.NUMBER, [], Type.NUMBER],
      min: ['min', Type.NUMBER, [Type.NUMBER], Type.NUMBER],
      sin: ['sin', Type.NUMBER, [], Type.NUMBER],
      acos: ['acos', Type.NUMBER, [], Type.NUMBER],
      ctg: ['ctg', Type.NUMBER, [], Type.NUMBER],
      ln: ['ln', Type.NUMBER, [], Type.NUMBER],
      square: ['sqr', Type.NUMBER, [], Type.NUMBER],
      asin: ['asin', Type.NUMBER, [], Type.NUMBER],
      eps: ['eps', Type.NUMBER, [], Type.NUMBER],
      log: ['log', Type.NUMBER, [Type.NUMBER], Type.NUMBER],
      sqrt: ['sqrt', Type.NUMBER, [], Type.NUMBER],
      atg2: ['atg2', Type.NUMBER, [Type.NUMBER], Type.NUMBER],
      exp: ['exp', Type.NUMBER, [], Type.NUMBER],
      max: ['max', Type.NUMBER, [Type.NUMBER], Type.NUMBER],
      tan: ['tg', Type.NUMBER, [], Type.NUMBER],
      atan: ['atg', Type.NUMBER, [], Type.NUMBER],
      d360: ['d360', Type.NUMBER, [], Type.NUMBER],
      toDegrees: ['rddg', Type.NUMBER, [], Type.NUMBER],
      toRadians: ['dgrd', Type.NUMBER, [], Type.NUMBER],
      rnor: ['rnor', Type.NUMBER, [], Type.NUMBER],
      toLowerCase: ['lc', Type.STRING, [], Type.STRING],
      toUpperCase: ['uc', Type.STRING, [], Type.STRING],
    };
    if (ops[node.callee.value]) {
      const [raw, self, args, ret] = ops[node.callee.value];

      const checkSelf = () => {
        this.visit(node.target);
        const t0 = this.pop();
        if (t0 !== self) {
          this.raise(TypeError, `Expected ${self} but got ${t0}`, node.target);
        }
      };
      if (node.callee.value !== 'range') {
        checkSelf();
      }

      if (args.length !== node.arguments.length) {
        this.raise(TypeError, `Expected ${args.length} arguments`, node.arguments);
      }
      node.arguments.forEach((a, i) => {
        this.visit(a);
        const t = this.pop();
        if (t !== args[i]) {
          this.raise(TypeError, `Expected ${args[i]} but got ${t}`, a);
        }
      });

      if (node.callee.value === 'range') {
        checkSelf();
      }

      this.emit(raw);
      this.push(ret);
    } else {
      this.raise(TypeError, `${node.callee.value} is not a valid operator`, node.callee);
    }
  }

  visitIdentifier(node) {
    const local = this.resolve(node.value);
    if (local === null) {
      this.raise(ReferenceError, `${node.value} is not declared`, node);
    }
    if (local.alias) {
      this.visit(local.alias);
    } else if (local.register !== undefined) {
      this.emit(`l${local.register}`);
      this.push(local.type);
    } else {
      this.raise(TypeError, `${node.value} is not a local`, node);
    }
  }

  visitBooleanLiteral(node) {
    this.emit(node.value ? '1' : '0');
    this.push(Type.BOOLEAN);
  }

  visitNumberLiteral(node) {
    this.emit(node.value.toString());
    this.push(Type.NUMBER);
  }

  visitStringLiteral(node) {
    this.emit(`'${node.value.toString()}'`);
    this.push(Type.STRING);
  }

  visitSimVar(node) {
    this.emit(`(${formatSimVar(node.value)})`);
    this.push(SimVarTypes[node.value.type] || Type.ANY);
  }

  visitTemplate(node) {
    this.emit(`#${node.value.name}#`);
    if (node.value.type) {
      if (!SimVarTypes[node.value.type]) {
        this.raise(TypeError, `${node.value.type} is not a valid type`, node);
      }
      this.push(SimVarTypes[node.value.type]);
    } else if (!node.statement) {
      this.raise(TypeError, 'Expected a type', node);
    }
  }

  visitIf(node) {
    this.visit(node.test);
    const t = this.pop();
    if (t !== Type.BOOLEAN) {
      this.raise(TypeError, `Expected ${Type.BOOLEAN} but got ${t}`, node.test);
    }

    const visitBranch = (open, n) => {
      const len = this.stack.length;

      this.emit(open);
      this.line();
      this.indent += 1;
      this.visit(n);
      this.indent -= 1;
      this.emit('}');

      /* istanbul ignore next */
      if (this.stack.length - len < 0) {
        throw new RangeError('values popped');
      }
      if (this.stack.length !== len) {
        return this.pop();
      }
      return Type.VOID;
    };

    const t0 = visitBranch('if{', node.consequent);
    if (t0 !== Type.VOID && !node.alternative) {
      this.raise(SyntaxError, 'If expression with consequent value must have alternative', node);
    }

    if (node.alternative) {
      const t1 = visitBranch('els{', node.alternative);
      if (t0 !== t1) {
        this.raise(TypeError, `consequent returns ${t0} but alternative returns ${t1}`, node);
      }
    }

    if (t0 !== Type.VOID) {
      if (node.statement) {
        this.raise(TypeError, `Expected ${Type.VOID} but got ${t0}`, node);
      }
      this.push(t0);
    }
  }

  visitBlock(node) {
    this.pushScope();
    this.visitStatementList(node.statements);
    this.popScope();
    if (node.statement) {
      const t0 = this.pop();
      if (t0 !== Type.VOID) {
        this.raise(TypeError, `Expected ${Type.VOID} but got ${t0}`, node);
      }
    }
  }
}

var assembler = { Assembler };

var src = createCommonjsModule(function (module) {

const { kMessage } = util;
const { Type } = type;
const { Parser } = parser;
const { Assembler } = assembler;

function translate(source, {
  specifier = '(anonymous)',
  returnType = Type.VOID,
  getSource,
} = {}) {
  try {
    const ast = Parser.parse(source, specifier);
    const {
      warnings,
      output,
    } = Assembler.assemble(ast, returnType, source, specifier, getSource);
    return {
      output,
      messages: warnings.map((w) => ({
        level: 'warning',
        ...w,
        stack: undefined,
      })),
    };
  } catch (e) {
    /* istanbul ignore else */
    if (e && e[kMessage]) {
      return {
        output: '',
        messages: [{
          level: 'error',
          ...e[kMessage],
          stack: e.stack,
        }],
      };
    }
    /* istanbul ignore next */
    throw e;
  }
}

module.exports = {
  Type,
  translate,
};
});

export default src;
//# sourceMappingURL=rnp.mjs.map
