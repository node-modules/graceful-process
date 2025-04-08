/* eslint-disable @typescript-eslint/no-var-requires */
const childProcess = require('node:child_process');
const path = require('node:path');

const childFile = path.join(__dirname, 'child.cjs');

const child = childProcess.fork(childFile);

process.once('SIGTERM', () => {
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGTERM'), 50);
  setTimeout(() => process.exit(0), 1500);
});

console.log('master fork %s done', childFile);
