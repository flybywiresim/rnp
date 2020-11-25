'use strict';

const fs = require('fs');
const path = require('path');
const tap = require('tap');
const { translate } = require('..');

function* readdir(d) {
  for (const dirent of fs.readdirSync(d, { withFileTypes: true })) {
    const resolved = path.join(d, dirent.name);
    if (dirent.isDirectory()) {
      yield* readdir(resolved);
    } else {
      yield resolved;
    }
  }
}

for (const filename of readdir(path.join(__dirname, 'pass'))) {
  const test = path.relative(__dirname, filename);
  tap.test(test, (t) => { // eslint-disable-line no-loop-func
    const [source, expectedRaw] = fs.readFileSync(filename, 'utf8').split('---');
    // for the moment rnp emits a single line of code, so don't worry about newlines and such
    const actual = translate(source, test);
    const expected = expectedRaw
      .trim()
      .replace(/\s*\n\s*/g, ' ');
    t.equal(actual, expected);
    t.end();
  });
}

for (const filename of readdir(path.join(__dirname, 'fail'))) {
  const test = path.relative(__dirname, filename);
  tap.test(test, (t) => { // eslint-disable-line no-loop-func
    const [source, expected] = fs.readFileSync(filename, 'utf8').split('---\n');
    try {
      translate(source, test);
      t.fail();
    } catch (e) {
      t.equal(e.stack.split('    at')[0], expected);
    }
    t.end();
  });
}
