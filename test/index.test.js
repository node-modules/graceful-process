'use strict';

const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const sleep = require('mz-modules/sleep');
const urllib = require('urllib');

const fixtures = path.join(__dirname, 'fixtures');
const waitStart = process.env.CI ? 20000 : 2000;

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
      child.expect('stderr', /receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stdout', /exit with code:0/);
    });

    it('should workers auto exit when master kill by SIGTERM', function* () {
      const startFile = path.join(fixtures, 'cluster.js');
      const child = coffee.fork(startFile)
        .debug();
      yield sleep(waitStart);
      const result = yield urllib.request('http://127.0.0.1:8000/');
      assert(result.status === 200);
      assert(result.data.toString() === 'hello world\n');
      // make sure all workers exit by itself after SIGTERM event fired
      child.proc.kill('SIGTERM');
      yield sleep(1000);
      child.notExpect('stderr', /receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/);
      child.expect('stdout', /receive signal SIGTERM, exiting with code:0/);
      child.expect('stdout', /exit with code:0/);
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
      yield sleep(1000);
      child.expect('stderr', /receive disconnect event on child_process fork mode, exiting with code:110/);
      child.expect('stderr', /exit with code:110/);
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
});
