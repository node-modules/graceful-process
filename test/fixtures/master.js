'use strict';

const childProcess = require('child_process');
const path = require('path');

const childFile = path.join(__dirname, 'child.js');

childProcess.fork(childFile);

console.log('master fork %s done', childFile);
