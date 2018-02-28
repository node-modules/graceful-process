'use strict';

const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const sleep = require('mz-modules/sleep');
const urllib = require('urllib');
const mm = require('mm');

const fixtures = path.join(__dirname, 'fixtures');
const waitStart = process.env.COV ? 5000 : 2000;

describe('test/index.test.js', () => {
  describe('cluster', () => {
    it('should workers auto exit when master kill by SIGKILL', function* () {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // all workers exit by cluster
      child.proc.kill('SIGKILL');
      yield sleep(1000);
      child.expect('stderr', /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stderr', /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stdout', /\[app-worker-1\] exit with code:0/);
      child.expect('stdout', /\[app-worker-2\] exit with code:0/);
    });

    it('should don\'t print info log', function* () {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile, { env: { NODE_LOG_LEVEL: 'warn' } })
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // all workers exit by cluster
      child.proc.kill('SIGKILL');
      yield sleep(1000);
      child.expect('stderr', /\[app-worker-1\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stderr', /\[app-worker-2\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.notExpect('stdout', /\[app-worker-1\] exit with code:0/);
      child.notExpect('stdout', /\[app-worker-2\] exit with code:0/);
    });

    it('should workers auto exit when master kill by SIGTERM', function* () {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // suicide
      const result2 = yield urllib.request('http://127.0.0.1:8000/suicide');
      assert(result2.status === 200);
      assert(result2.data.toString() === 'hello world\n');
      yield sleep(1000);
      // make sure all workers exit by itself after SIGTERM event fired
      child.proc.kill('SIGTERM');
      yield sleep(2000);
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
    it('should worker exit after master kill by SIGKILL', function* () {
      const startFile = path.join(fixtures, 'master.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // the worker exit by graceful-process
      child.proc.kill('SIGKILL');
      yield sleep(2000);
      if (process.platform !== 'win32') {
        child.expect('stderr', /\[test-child\] receive disconnect event on child_process fork mode, exiting with code:110/);
        child.expect('stderr', /\[test-child\] exit with code:110/);
      }
    });
  });

  describe.skip('child_process.spawn', () => {
    it('should worker exit after master kill by SIGKILL', function* () {
      const startFile = path.join(fixtures, 'master-spawn.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // the worker exit by graceful-process
      child.proc.kill('SIGKILL');
      yield sleep(1000);
      child.expect('stderr', /222receive disconnect event on child_process fork mode, exiting with code:110/);
      child.expect('stderr', /222exit with code:110/);
    });
  });

  describe('beforeExit', () => {
    afterEach(mm.restore);

    it('should support normal function', function* () {
      mm(process.env, 'MODE', '');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      child.proc.kill();
      yield sleep(5000);
      child.expect('stdout', /process exit/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should support function return promise', function* () {
      mm(process.env, 'MODE', 'promise');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      child.proc.kill();
      yield sleep(5000);
      child.expect('stdout', /process exiting\nprocess exited/);
      child.expect('stdout', /exit with code:0/);
    });

    if (parseInt(process.versions.node) < 8) return;

    it('should support async function', function* () {
      mm(process.env, 'MODE', 'async');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      child.proc.kill();
      yield sleep(5000);
      child.expect('stdout', /process exiting\nprocess exited/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should exit when promise reject', function* () {
      mm(process.env, 'MODE', 'reject');
      const startFile = path.join(fixtures, 'before-exit.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);

      child.proc.kill();
      yield sleep(5000);
      child.expect('stderr', /beforeExit fail, error: reject/);
      child.expect('stdout', /exit with code:0/);
    });
  });
});
