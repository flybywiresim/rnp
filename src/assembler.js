'use strict';

const { OperatorOverload } = require('./lexer');
const { Parser } = require('./parser');
const { createError, createMessage } = require('./util');
const { Type, SimVarTypes } = require('./type');

const OpTypes = {
  '+': [Type.NUMBER, Type.NUMBER],
  '-': [Type.NUMBER, Type.NUMBER],
  '/': [Type.NUMBER, Type.NUMBER],
  '//': [Type.NUMBER, Type.NUMBER],
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
  constructor(source, specifier, getSource) {
    this.source = source;
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
    /* istanbul ignore next */
    if (a.pop() !== Type.VOID) {
      throw new RangeError('invalid stack state');
    }
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
    this.warnings.push({ detail, message });
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
  }

  visitImportDeclaration(node) {
    const { source, specifier } = this.getSource(this.specifier, node.specifier.value);
    const ast = Parser.parse(source, specifier);
    const a = new Assembler(source, specifier, this.getSource);
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
    } else {
      this.emit(`l${local.register}`);
      this.push(local.type);
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

module.exports = { Assembler };
