/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('node:http');
const { graceful } = require('../..');

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);

console.log(`Worker ${process.pid} started`);
const options = {
  logger: console,
  label: 'test-child',
  logLevel: process.env.NODE_LOG_LEVEL,
};
if (process.env.ALWAYS_ON_SIGTERM) {
  options.sigterm = 'always';
  options.beforeExit = async () => {
    await new Promise(r => setTimeout(r, 1000));
    console.log('exit after 1000ms');
  };
}
graceful(options);

// run again should work
graceful();
