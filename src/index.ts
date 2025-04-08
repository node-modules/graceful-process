import cluster from 'node:cluster';
import { getExitFunction } from './exit.js';
import type { Logger, BeforeExit } from './types.js';

const INITED = Symbol('graceful-process-init');

export interface Options {
  logger?: Logger;
  logLevel?: string;
  label?: string;
  timeout?: number;
  beforeExit?: BeforeExit;
  sigterm?: 'always' | 'once';
}

export function graceful(options: Options = {}) {
  const logger = options.logger || console;
  let logLevel = (options.logLevel ?? 'info').toLowerCase();
  if (logger !== console) {
    // don't handle custom logger level
    logLevel = 'info';
  }
  const printLogLevels = {
    info: true,
    warn: true,
    error: true,
  };
  if (logLevel === 'warn') {
    printLogLevels.info = false;
  } else if (logLevel === 'error') {
    printLogLevels.info = false;
    printLogLevels.warn = false;
  }
  const label = options.label ?? `graceful-process#${process.pid}`;
  const timeout = options.timeout ?? parseInt(process.env.GRACEFUL_TIMEOUT ?? '5000');

  if (Reflect.get(process, INITED)) {
    printLogLevels.warn && logger.warn('[%s] graceful-process init already', label);
    return;
  }
  Reflect.set(process, INITED, true);

  const exit = getExitFunction(logger, label, timeout, options.beforeExit);

  // https://github.com/eggjs/egg-cluster/blob/master/lib/agent_worker.js#L35
  // exit gracefully
  if (options.sigterm === 'always') {
    let called = false;
    process.on('SIGTERM', () => {
      if (called) {
        printLogLevels.info && logger.info('[%s] receive signal SIGTERM again, waiting for exit', label);
        return;
      }
      called = true;
      printLogLevels.info && logger.info('[%s] receive signal SIGTERM, exiting with code:0', label);
      exit(0);
    });
  } else {
    process.once('SIGTERM', () => {
      printLogLevels.info && logger.info('[%s] receive signal SIGTERM, exiting with code:0', label);
      exit(0);
    });
  }

  process.once('exit', code => {
    const level = code === 0 ? 'info' : 'error';
    printLogLevels[level] && logger[level]('[%s] exit with code:%s', label, code);
  });

  if (cluster.worker) {
    // cluster mode
    // https://github.com/nodejs/node/blob/6caf1b093ab0176b8ded68a53ab1ab72259bb1e0/lib/internal/cluster/child.js#L28
    cluster.worker.once('disconnect', () => {
      // ignore suicide disconnect event
      if (cluster.worker?.exitedAfterDisconnect) {
        return;
      }
      logger.error('[%s] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false', label);
    });
  } else {
    // child_process mode
    process.once('disconnect', () => {
      // wait a loop for SIGTERM event happen
      setImmediate(() => {
        // if disconnect event emit, maybe master exit in accident
        logger.error('[%s] receive disconnect event on child_process fork mode, exiting with code:110', label);
        exit(110);
      });
    });
  }
}
