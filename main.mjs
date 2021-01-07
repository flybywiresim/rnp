/* global CodeMirror */
/* eslint-env browser */

import rnp from './rnp.mjs';

CodeMirror.defineMode('rnp', (config) => ({
  startState() {
    return {
      blockComment: 0,
      indent: [],
    };
  },
  token(stream, state) {
    if (stream.match('/*')) {
      state.blockComment += 1;
      return 'comment';
    }
    if (stream.match('*/')) {
      state.blockComment -= 1;
      return 'comment';
    }
    if (state.blockComment) {
      stream.next();
      return 'comment';
    }
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.eatSpace()) {
      return null;
    }
    if (stream.match(/(?:if|else|let|alias|macro|import|export|from)\b/)) {
      return 'keyword';
    }
    if (stream.match(/(?:true|false)\b|\(.:.+?\)|#.+?#/)) {
      return 'atom';
    }
    if (stream.match(/(?:[-+/*=<>!]+)|(?:(?:and|or)\b)/)) {
      return 'operator';
    }
    if (stream.match(/\$\p{ID_Continue}*/u)) {
      return 'variable-2';
    }
    if (stream.match(/\p{ID_Start}\p{ID_Continue}*/u)) {
      return 'variable';
    }
    if (stream.match(/'(?:[^\\]|\\.)*?(?:'|$)/)) {
      return 'string';
    }
    if (stream.match(/-?0x[a-f\d]+|-?0b[01]+|-?(?:\.\d+|\d+\.?\d*)(?:e-?\d+)?/i)) {
      return 'number';
    }
    if (stream.eat(/{|\(/)) {
      state.indent.push(stream.indentation() + config.indentUnit);
      return null;
    }
    if (stream.eat(/\)|}/)) {
      state.indent.pop();
      return null;
    }
    stream.next();
    return null;
  },
  indent(state, textAfter) {
    let pos = state.indent.length - 1;
    for (let i = 0; i < textAfter.length; i += 1) {
      if (textAfter[i] === '}' || textAfter[i] === ')') {
        pos -= 1;
      }
    }
    return pos < 0 ? 0 : state.indent[pos];
  },
  lineComment: '//',
  blockCommentStart: '/*',
  blockCommendEnd: '*/',
  closeBrackets: '(){}\'\'',
}));

let cmErrors = [];
CodeMirror.registerHelper('lint', 'rnp', () => cmErrors);

const output = document.querySelector('#output');
const editor = CodeMirror.fromTextArea(document.querySelector('#input'), {
  lineNumbers: true,
  mode: 'rnp',
  gutters: ['CodeMirror-lint-markers'],
  lint: true,
  theme: 'rnp-dark',
  autoCloseBrackets: true,
  matchBrackets: true,
  styleActiveLine: true,
});

function translate() {
  const { output: translated, messages } = rnp.translate(editor.getValue(), '(input)', (r, s) => {
    throw new Error(`Could not resolve '${s}' from '${r}'`);
  });
  cmErrors = messages.map((m) => ({
    severity: m.level,
    message: m.message,
    from: CodeMirror.Pos(m.location.start.line - 1, m.location.start.column - 1),
    to: CodeMirror.Pos(m.location.end.line - 1, m.location.end.column - 1),
  }));
  if (translated) {
    output.innerHTML = translated;
  }
}

let onChangeTimer;
editor.on('change', () => {
  if (onChangeTimer !== null) {
    clearTimeout(onChangeTimer);
  }
  onChangeTimer = setTimeout(translate, 250);
});
translate();
