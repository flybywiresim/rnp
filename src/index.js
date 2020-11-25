'use strict';

const { Parser } = require('./parser');
const { Assembler } = require('./assembler');

function translate(source, specifier, getSource) {
  const ast = Parser.parse(source, specifier);
  const out = Assembler.assemble(ast, source, specifier, getSource);
  return out;
}

module.exports = {
  translate,
};

/* istanbul ignore next */
if (require.main === module) {
  /* eslint-disable global-require */
  const util = require('util');
  const repl = require('repl');
  const fs = require('fs');
  const path = require('path');

  const getSource = (referrer, specifier) => {
    const resolved = path.join(referrer === '(repl)' ? '.' : path.basename(referrer), specifier);
    const source = fs.readFileSync(resolved, 'utf8');
    return {
      source,
      specifier: resolved,
    };
  };

  repl.start({
    prompt: '> ',
    eval(source, c, f, cb) {
      try {
        cb(null, translate(source, '(repl)', getSource));
      } catch (e) {
        cb(e, null);
      }
    },
    writer: (v) => (typeof v === 'string' ? v : util.inspect(v)),
  });
}
