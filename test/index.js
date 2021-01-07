'use strict';

const fs = require('fs');
const path = require('path');
const tap = require('tap');
const { translate, Type } = require('..');

function* readdir(d) {
  for (const dirent of fs.readdirSync(d, { withFileTypes: true })) {
    const resolved = path.join(d, dirent.name);
    if (dirent.isDirectory()) {
      yield* readdir(resolved);
    } else if (!dirent.name.includes('FIXTURE')) {
      yield resolved;
    }
  }
}

function getSource(referrer, specifier) {
  const resolved = path.join('test', path.dirname(referrer), specifier);
  const source = fs.readFileSync(resolved, 'utf8');
  return {
    source,
    specifier: resolved,
  };
}

for (const filename of readdir(path.join(__dirname, 'pass'))) {
  const test = path.relative(__dirname, filename);
  tap.test(test, (t) => { // eslint-disable-line no-loop-func
    const [source, expectedRaw] = fs.readFileSync(filename, 'utf8').split('---');
    // for the moment rnp emits a single line of code, so don't worry about newlines and such
    const { output: actual } = translate(source, {
      specifier: test,
      getSource,
    });
    t.equal(actual, expectedRaw.trim());
    t.end();
  });
}

for (const filename of readdir(path.join(__dirname, 'fail'))) {
  const test = path.relative(__dirname, filename);
  tap.test(test, (t) => { // eslint-disable-line no-loop-func
    const [source, expected] = fs.readFileSync(filename, 'utf8').split('---\n');
    const rawFlags = /\/\/ Flags: (.+)/.exec(source);
    const flags = {};
    if (rawFlags) {
      rawFlags[1]
        .split(' ')
        .forEach((f) => {
          if (f.includes('=')) {
            const [k, v] = f.split('=');
            flags[k] = v;
          } else {
            flags[f] = true;
          }
        });
    }
    const { messages } = translate(source, {
      specifier: test,
      getSource: flags['no-get-source'] ? undefined : getSource,
      returnType: flags['return-type'] ? Type[flags['return-type']] : undefined,
    });
    t.equal(messages[0].detail, expected.trimEnd());
    t.end();
  });
}

tap.test('random translate stuff', (t) => {
  translate('');
  t.end();
});
