/* eslint-disable @typescript-eslint/no-var-requires */
const childProcess = require('node:child_process');
const path = require('node:path');

const childFile = path.join(__dirname, 'child.cjs');

childProcess.fork(childFile);

console.log('master fork %s done', childFile);
