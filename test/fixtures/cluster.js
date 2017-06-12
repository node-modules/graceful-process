'use strict';

const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died, code ${code}, signal ${signal}`);
  });

  process.once('SIGTERM', () => {
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill('SIGTERM');
    }
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
    if (req.url === '/suicide') {
      cluster.worker.disconnect();
    }
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
  require('../..')();
}
