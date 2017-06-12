'use strict';

const childProcess = require('child_process');
const path = require('path');

const childFile = path.join(__dirname, 'child.js');

childProcess.spawn(process.execPath, [ childFile ], {
  stdio: 'inherit',
});

console.log('master %s %s done', process.execPath, childFile);
