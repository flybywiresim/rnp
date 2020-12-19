'use strict';

const kMessage = Symbol('kMessage');

function createMessage(source, location, specifier, message) {
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
        return `${start}| ${line}\n${pad} | |_${'_'.repeat(location.end.column - 2)}^ ${message}`;
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

function createError(T, source, location, specifier, message) {
  const payload = {
    message,
    detail: createMessage(source, location, specifier, message),
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

module.exports = { createError, createMessage, kMessage };
