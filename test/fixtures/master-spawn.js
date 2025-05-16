/* eslint-disable @typescript-eslint/no-var-requires */
const childProcess = require('node:child_process');
const path = require('node:path');

const childFile = path.join(__dirname, 'child.cjs');

childProcess.spawn(process.execPath, [childFile], {
  stdio: 'inherit',
});

console.log('master %s %s done', process.execPath, childFile);
