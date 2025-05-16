/* eslint-disable @typescript-eslint/no-var-requires */
const cluster = require('node:cluster');
const http = require('node:http');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(
      `worker ${worker.process.pid} died, code ${code}, signal ${signal}`
    );
  });

  process.once('SIGTERM', () => {
    const killWorkers = () => {
      for (const id in cluster.workers) {
        cluster.workers[id].process.kill('SIGTERM');
      }
    };

    killWorkers();

    if (process.env.ALWAYS_ON_SIGTERM) {
      setTimeout(killWorkers, 50);
      setTimeout(() => process.exit(0), 2100);
    } else {
      setTimeout(() => {
        process.exit(0);
      }, 100);
    }
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end('hello world\n');
      if (req.url === '/suicide') {
        cluster.worker.disconnect();
      }
    })
    .listen(8000);

  console.log(`Worker ${process.pid} started`);
  const { graceful } = require('../..');
  const options = {
    label: 'app-worker-' + cluster.worker.id,
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
}
