import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';

import type { Logger, BeforeExit } from './types.js';

const TIMEOUT = Symbol('before exit timeout');

export function getExitFunction(
  logger: Logger,
  label: string,
  timeout: number,
  beforeExit?: BeforeExit
) {
  if (beforeExit) {
    assert.ok(
      typeof beforeExit === 'function',
      'beforeExit only support function'
    );
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
      // oxlint-disable-next-line unicorn/no-process-exit
      process.exit(code);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('[%s] beforeExit fail, error: %s', label, message);
      // oxlint-disable-next-line unicorn/no-process-exit
      process.exit(code);
    }
  };
}
