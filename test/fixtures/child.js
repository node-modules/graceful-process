'use strict';

const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);

console.log(`Worker ${process.pid} started`);
require('../..')();
