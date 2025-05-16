import { strict as assert } from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

import { describe, it, afterEach } from 'vitest';
import coffee from 'coffee';
import { request } from 'urllib';
import fkill from 'fkill';
import { mm } from 'mm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixtures = path.join(__dirname, 'fixtures');
const waitStart = process.env.COV ? 5000 : 2000;

// oxlint-disable-next-line @typescript-eslint/no-explicit-any
async function killChild(child: any, force?: boolean) {
  console.log('killing %s', child.proc.pid);
  await fkill(child.proc.pid, { force, silent: true });
  console.log('killed %s', child.proc.pid);
}

describe('test/index.test.ts', () => {
  describe('cluster', () => {
    it('should workers auto exit when master kill by SIGKILL', async () => {
      const startFile = path.join(fixtures, 'cluster.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);
      assert.ok(result.data.toString() === 'hello world\n');
      // all workers exit by cluster
      await killChild(child, true);
      await sleep(1000);
      child.expect(
        'stderr',
        /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/
      );
      child.expect(
        'stderr',
        /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/
      );
      child.expect('stdout', /\[app-worker-1\] exit with code:0/);
      child.expect('stdout', /\[app-worker-2\] exit with code:0/);
    });

    it("should don't print info log", async () => {
      const startFile = path.join(fixtures, 'cluster.cjs');
      const child = coffee
        .fork(startFile, { env: { NODE_LOG_LEVEL: 'warn' } })
        .debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);
      assert.ok(result.data.toString() === 'hello world\n');
      // all workers exit by cluster
      await killChild(child, true);
      await sleep(1000);
      child.expect(
        'stderr',
        /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/
      );
      child.expect(
        'stderr',
        /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/
      );
      child.notExpect('stdout', /\[app-worker-1\] exit with code:0/);
      child.notExpect('stdout', /\[app-worker-2\] exit with code:0/);
    });

    it('should workers auto exit when master kill by SIGTERM', async () => {
      const startFile = path.join(fixtures, 'cluster.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);
      assert.ok(result.data.toString() === 'hello world\n');
      // suicide
      const result2 = await request('http://127.0.0.1:8000/suicide');
      assert.ok(result2.status === 200);
      assert.ok(result2.data.toString() === 'hello world\n');
      await sleep(1000);
      // make sure all workers exit by itself after SIGTERM event fired
      // @ts-expect-error type error
      child.proc.kill('SIGTERM');
      await sleep(2000);
      child.notExpect(
        'stderr',
        /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/
      );
      child.notExpect(
        'stderr',
        /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/
      );
      if (process.platform !== 'win32') {
        // windows can't handle SIGTERM signal
        child.expect(
          'stdout',
          /\[app-worker-\d\] receive signal SIGTERM, exiting with code:0/
        );
      }
      child.expect('stdout', /\[app-worker-1\] exit with code:0/);
      child.expect('stdout', /\[app-worker-2\] exit with code:0/);
      // no exit event on coverage mode
      // child.expect('stdout', /worker \d+ died, code 0, signal null/);
    });

    it('should always listen sigterm work', async () => {
      const startFile = path.join(fixtures, 'cluster.cjs');
      const child = coffee
        .fork(startFile, [], {
          env: {
            ...process.env,
            ALWAYS_ON_SIGTERM: 'Y',
          },
        })
        .debug();
      await sleep(waitStart);
      // @ts-expect-error type error
      child.proc.kill('SIGTERM');
      await sleep(2200);
      if (process.platform !== 'win32') {
        // windows can't handle SIGTERM signal
        child.expect(
          'stdout',
          /\[app-worker-\d\] receive signal SIGTERM, exiting with code:0/
        );
        child.expect(
          'stdout',
          /\[app-worker-\d\] receive signal SIGTERM again, waiting for exit/
        );
        child.expect('stdout', /exit after 1000ms/);
      }
      child.expect('stdout', /\[app-worker-1\] exit with code:0/);
      child.expect('stdout', /\[app-worker-2\] exit with code:0/);
    });
  });

  describe('child_process.fork', () => {
    it('should worker exit after master kill by SIGKILL', async () => {
      const startFile = path.join(fixtures, 'master.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);
      assert.ok(result.data.toString() === 'hello world\n');
      // the worker exit by graceful-process
      await killChild(child, true);
      await sleep(2000);
      if (process.platform !== 'win32') {
        child.expect(
          'stderr',
          /\[test-child\] receive disconnect event on child_process fork mode, exiting with code:110/
        );
        child.expect('stderr', /\[test-child\] exit with code:110/);
      }
    });

    it('should always listen sigterm work', async () => {
      const startFile = path.join(fixtures, 'master-sigterm.cjs');
      const child = coffee
        .fork(startFile, [], {
          env: {
            ...process.env,
            ALWAYS_ON_SIGTERM: 'Y',
          },
        })
        .debug();
      await sleep(waitStart);
      // the worker exit by graceful-process
      // @ts-expect-error type error
      child.proc.kill('SIGTERM');
      await sleep(2000);
      if (process.platform !== 'win32') {
        // windows can't handle SIGTERM signal
        child.expect(
          'stdout',
          /\[test-child\] receive signal SIGTERM, exiting with code:0/
        );
        child.expect(
          'stdout',
          /\[test-child\] receive signal SIGTERM again, waiting for exit/
        );
        child.expect('stdout', /exit after 1000ms/);
        child.expect('stdout', /\[test-child\] exit with code:0/);
      }
    });
  });

  describe.skip('child_process.spawn', () => {
    it('should worker exit after master kill by SIGKILL', async () => {
      const startFile = path.join(fixtures, 'master-spawn.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);
      assert.ok(result.data.toString() === 'hello world\n');
      // the worker exit by graceful-process
      await killChild(child, true);
      await sleep(1000);
      child.expect(
        'stderr',
        /222receive disconnect event on child_process fork mode, exiting with code:110/
      );
      child.expect('stderr', /222exit with code:110/);
    });
  });

  describe('beforeExit', () => {
    afterEach(mm.restore);

    it('should support normal function', async () => {
      mm(process.env, 'MODE', '');
      const startFile = path.join(fixtures, 'before-exit.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stdout', /process exit/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should support function return promise', async () => {
      mm(process.env, 'MODE', 'promise');
      const startFile = path.join(fixtures, 'before-exit.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stdout', /beforeExit success/);
      child.expect('stdout', /process exiting\nprocess exited/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should support async function', async () => {
      mm(process.env, 'MODE', 'async');
      const startFile = path.join(fixtures, 'before-exit.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.equal(result.status, 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stdout', /beforeExit success/);
      child.expect('stdout', /process exiting\nprocess exited/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when async error', async () => {
      mm(process.env, 'MODE', 'async-error');
      const startFile = path.join(fixtures, 'before-exit.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stderr', /beforeExit fail, error: reject/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when function error', async () => {
      mm(process.env, 'MODE', 'function-error');
      const startFile = path.join(fixtures, 'before-exit.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stderr', /beforeExit fail, error: process exit/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when function timeout error', async () => {
      mm(process.env, 'MODE', 'timeout');
      mm(process.env, 'GRACEFUL_TIMEOUT', 1000);
      const startFile = path.join(fixtures, 'before-exit.cjs');
      const child = coffee.fork(startFile).debug();
      await sleep(waitStart);
      const result = await request('http://127.0.0.1:8000/');
      assert.ok(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stderr', /beforeExit fail, error: Timeout/);
      child.expect('stdout', /exit with code:0/);
    });
  });
});
