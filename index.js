'use strict';

const cluster = require('cluster');
const init = Symbol('graceful-process-init');

module.exports = (options = {}) => {
  const logger = options.logger || console;
  const label = options.label || `graceful-process#${process.pid}`;
  if (process[init]) {
    logger.warn('[%s] graceful-process init already', label);
    return;
  }
  process[init] = true;

  // https://github.com/eggjs/egg-cluster/blob/master/lib/agent_worker.js#L35
  // exit gracefully
  process.once('SIGTERM', () => {
    logger.info('[%s] receive signal SIGTERM, exiting with code:0', label);
    process.exit(0);
  });

  process.once('exit', code => {
    const level = code === 0 ? 'info' : 'error';
    logger[level]('[%s] exit with code:%s', label, code);
  });

  if (cluster.worker) {
    // cluster mode
    // https://github.com/nodejs/node/blob/6caf1b093ab0176b8ded68a53ab1ab72259bb1e0/lib/internal/cluster/child.js#L28
    cluster.worker.once('disconnect', () => {
      // ignore suicide disconnect event
      if (cluster.worker.exitedAfterDisconnect) return;

      logger.error('[%s] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false', label);
    });
  } else {
    // child_process mode
    process.once('disconnect', () => {
      // wait a loop for SIGTERM event happen
      setImmediate(() => {
        // if disconnect event emit, maybe master exit in accident
        logger.error('[%s] receive disconnect event on child_process fork mode, exiting with code:110', label);
        process.exit(110);
      });
    });
  }
};
