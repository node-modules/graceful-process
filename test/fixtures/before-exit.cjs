/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('node:http');
const { setTimeout: sleep } = require('node:timers/promises');
const { graceful } = require('../..');

http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  })
  .listen(8000);

let beforeExit;
switch (process.env.MODE) {
  case 'async':
    beforeExit = require('./_async.cjs');
    break;
  case 'async-error':
    beforeExit = require('./_async_error.cjs');
    break;
  case 'promise':
    beforeExit = () => {
      console.log('process exiting');
      return sleep(1000).then(() => console.log('process exited'));
    };
    break;
  case 'timeout':
    beforeExit = () => {
      console.log('process exiting');
      return sleep(5000).then(() => {
        throw new Error('should no run here');
      });
    };
    break;
  case 'function-error':
    beforeExit = () => {
      throw new Error('process exit');
    };
    break;
  default:
    beforeExit = () => {
      console.log('process exit');
    };
}

console.log(`Worker ${process.pid} started`);
graceful({
  logger: console,
  beforeExit,
});

// run again should work
graceful();
