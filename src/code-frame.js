// MIT License
//
// Copyright (c) 2014-present Sebastian McKenzie and other contributors
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const LINES_ABOVE = 2;
const LINES_BELOW = 3;

function codeFrame(source, location, message) {
  const start = Math.max(location.start.line - (LINES_ABOVE + 1), 0);
  const end = Math.min(source.length, location.end.line + LINES_BELOW);

  const lineNumMaxWidth = String(end).length;

  return source
    .split('\n')
    .slice(start, end)
    .map((line, index) => {
      const lineNum = start + 1 + index;
      const paddedLineNum = ` ${lineNum}`.slice(-lineNumMaxWidth);
      const gutter = ` ${paddedLineNum} | `;
      if (lineNum >= location.start.line && lineNum <= location.end.line) {
        if ((location.start.line === location.end.line && lineNum === location.start.line)
            || (location.start.line !== location.end.line && lineNum === location.end.line)) {
          const offset = location.start.column - 1;
          const length = location.end.column - location.start.column;
          return `>${gutter}${line}\n ${gutter.replace(/\d/g, ' ')}${' '.repeat(offset)}${'^'.repeat(length)} ${message}`;
        }
        return `>${gutter}${line}`;
      }
      return ` ${gutter}${line}`;
    })
    .join('\n');
}

module.exports = codeFrame;
