/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('node:http');
const { graceful } = require('../..');

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);

console.log(`Worker ${process.pid} started`);
graceful({
  logger: console,
  label: 'test-child',
  logLevel: process.env.NODE_LOG_LEVEL,
});

// run again should work
graceful();
