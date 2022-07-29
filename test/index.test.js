'use strict';

const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const sleep = require('mz-modules/sleep');
const urllib = require('urllib');
const fkill = require('fkill');
const mm = require('mm');

const fixtures = path.join(__dirname, 'fixtures');
const waitStart = process.env.COV ? 5000 : 2000;

async function killChild(child, force) {
  console.log('killing %s', child.proc.pid);
  await fkill(child.proc.pid, { force, silent: true });
  console.log('killed %s', child.proc.pid);
}

describe('test/index.test.js', () => {
  describe('cluster', () => {
    it('should workers auto exit when master kill by SIGKILL', async () => {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // all workers exit by cluster
      await killChild(child, true);
      await sleep(1000);
      child.expect('stderr', /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stderr', /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stdout', /\[app-worker-1\] exit with code:0/);
      child.expect('stdout', /\[app-worker-2\] exit with code:0/);
    });

    it('should don\'t print info log', async () => {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile, { env: { NODE_LOG_LEVEL: 'warn' } })
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // all workers exit by cluster
      await killChild(child, true);
      await sleep(1000);
      child.expect('stderr', /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stderr', /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.notExpect('stdout', /\[app-worker-1\] exit with code:0/);
      child.notExpect('stdout', /\[app-worker-2\] exit with code:0/);
    });

    it('should workers auto exit when master kill by SIGTERM', async () => {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // suicide
      const result2 = await urllib.request('http://127.0.0.1:8000/suicide');
      assert(result2.status === 200);
      assert(result2.data.toString() === 'hello world\n');
      await sleep(1000);
      // make sure all workers exit by itself after SIGTERM event fired
      child.proc.kill('SIGTERM');
      await sleep(2000);
      child.notExpect('stderr', /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.notExpect('stderr', /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      if (process.platform !== 'win32') {
        // windows can't handle SIGTERM signal
        child.expect('stdout', /\[app-worker-\d\] receive signal SIGTERM, exiting with code:0/);
      }
      child.expect('stdout', /\[app-worker-1\] exit with code:0/);
      child.expect('stdout', /\[app-worker-2\] exit with code:0/);
      child.expect('stdout', /worker \d+ died, code 0, signal null/);
    });
  });

  describe('child_process.fork', () => {
    it('should worker exit after master kill by SIGKILL', async () => {
      const startFile = path.join(fixtures, 'master.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // the worker exit by graceful-process
      await killChild(child, true);
      await sleep(2000);
      if (process.platform !== 'win32') {
        child.expect('stderr', /\[test-child\] receive disconnect event on child_process fork mode, exiting with code:110/);
        child.expect('stderr', /\[test-child\] exit with code:110/);
      }
    });
  });

  describe.skip('child_process.spawn', () => {
    it('should worker exit after master kill by SIGKILL', async () => {
      const startFile = path.join(fixtures, 'master-spawn.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // the worker exit by graceful-process
      await killChild(child, true);
      await sleep(1000);
      child.expect('stderr', /222receive disconnect event on child_process fork mode, exiting with code:110/);
      child.expect('stderr', /222exit with code:110/);
    });
  });

  describe('beforeExit', () => {
    afterEach(mm.restore);

    it('should support normal function', async () => {
      mm(process.env, 'MODE', '');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stdout', /process exit/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should support function return promise', async () => {
      mm(process.env, 'MODE', 'promise');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stdout', /beforeExit success/);
      child.expect('stdout', /process exiting\nprocess exited/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should support async function', async () => {
      mm(process.env, 'MODE', 'async');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stdout', /beforeExit success/);
      child.expect('stdout', /process exiting\nprocess exited/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when async error', async () => {
      mm(process.env, 'MODE', 'async-error');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stderr', /beforeExit fail, error: reject/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when function error', async () => {
      mm(process.env, 'MODE', 'function-error');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stderr', /beforeExit fail, error: process exit/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when function error', async () => {
      mm(process.env, 'MODE', 'timeout');
      mm(process.env, 'GRACEFUL_TIMEOUT', 1000);
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      await sleep(waitStart);
      const result = await urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      await killChild(child);
      await sleep(5000);
      child.expect('stderr', /beforeExit fail, error: Timeout/);
      child.expect('stdout', /exit with code:0/);
    });
  });
});
