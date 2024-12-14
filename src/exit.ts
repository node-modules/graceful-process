import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';
import type { Logger, BeforeExit } from './types.js';

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
      await Promise.race([
        handler(),
        setTimeout(timeout),
      ]);
      logger.info('[%s] beforeExit success', label);
      process.exit(code);
    } catch (err) {
      logger.error('[%s] beforeExit fail, error: %s', label, err);
      process.exit(code);
    }
  };
}
