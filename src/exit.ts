import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import type { Logger, BeforeExit } from './types.js';

const TIMEOUT = Symbol('before exit timeout');

export function getExitFunction(logger: Logger, label: string, timeout: number, beforeExit?: BeforeExit) {
  if (beforeExit) {
    assert(typeof beforeExit === 'function', 'beforeExit only support function');
  }

  // only call beforeExit once
  let called = false;
  const handler = async () => {
    if (called) return;
    called = true;
    if (beforeExit) {
      await beforeExit();
    }
  };

  return async function exitFunction(code: number) {
    try {
      const result = await Promise.race([
        handler(),
        setTimeout(timeout, TIMEOUT),
      ]);
      if (result === TIMEOUT) {
        throw new Error(`Timeout ${timeout}ms`);
      }
      logger.info('[%s] beforeExit success', label);
      process.exit(code);
    } catch (err: any) {
      logger.error('[%s] beforeExit fail, error: %s', label, err.message);
      process.exit(code);
    }
  };
}
