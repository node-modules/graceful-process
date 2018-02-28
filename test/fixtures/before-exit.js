'use strict';

const http = require('http');
const sleep = require('mz-modules/sleep');

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);

let beforeExit;
switch (process.env.MODE) {
  case 'async':
    beforeExit = require('./_async');
    break;
  case 'reject':
    beforeExit = require('./_reject');
    break;
  case 'promise':
    beforeExit = () => {
      console.log('process exiting');
      return sleep(1000).then(() => console.log('process exited'));
    };
    break;
  default:
    beforeExit = () => {
      console.log('process exit');
    };
}

console.log(`Worker ${process.pid} started`);
require('../..')({
  logger: console,
  beforeExit,
});

// run again should work
require('../..')();
