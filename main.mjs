/* global CodeMirror */
/* eslint-env browser */

import rnp from './rnp.mjs';

CodeMirror.defineSimpleMode('rnp', {
  start: [
    { regex: /'(?:[^\\]|\\.)*?(?:'|$)/, token: 'string' },
    { regex: /(?:if|else|let|alias|macro|import|export|from)\b/, token: 'keyword' },
    { regex: /true|false|\(.:.+\)/, token: 'atom' },
    { regex: /-?0x[a-f\d]+|-?0b[01]+|-?(?:\.\d+|\d+\.?\d*)(?:e-?\d+)?/i, token: 'number' },
    { regex: /[-+/*=<>!]+/, token: 'operator' },
    { regex: /{/, indent: true },
    { regex: /}/, dedent: true },
    { regex: /#\*/, push: 'comment' },
    { regex: /\p{ID_Start}\p{ID_Continue}*/u, token: 'variable' },
  ],
  comment: [
    { regex: /\*#/, pop: 'comment' },
  ],
  meta: {
    dontIndentStates: ['comment'],
    lineComment: '#',
  },
});

let cmErrors = [];
CodeMirror.registerHelper('lint', 'rnp', () => cmErrors);

const output = document.querySelector('#output');
const editor = CodeMirror.fromTextArea(document.querySelector('#input'), {
  lineNumbers: true,
  mode: 'rnp',
  gutters: ['CodeMirror-lint-markers'],
  lint: true,
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
