/* global CodeMirror */
/* eslint-env browser */

import rnp from './rnp.mjs';

const output = document.querySelector('#output');
const errors = document.querySelector('#errors');
const editor = CodeMirror.fromTextArea(document.querySelector('#input'), {
  lineNumbers: true,
  mode: 'javascript',
});

function translate() {
  const { output: translated, messages } = rnp.translate(editor.getValue(), '(input)', (r, s) => {
    throw new Error(`Could not resolve '${s}' from '${r}'`);
  });
  errors.innerHTML = messages.map((m) => `${m.level}: ${m.message}\n${m.detail}`).join('\n');
  output.innerHTML = translated;
}

let onChangeTimer;
editor.on('change', () => {
  if (onChangeTimer !== null) {
    clearTimeout(onChangeTimer);
  }
  onChangeTimer = setTimeout(translate, 250);
});
