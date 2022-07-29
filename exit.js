'use strict';

const assert = require('assert');
const once = require('once');
const pt = require('promise-timeout');

module.exports = function getExitFunction(beforeExit, logger, label, timeout) {
  assert(!beforeExit || typeof beforeExit === 'function', 'beforeExit only support function');

  // only call beforeExit once
  const handler = once(() => {
    return new Promise(resolve => {
      resolve(beforeExit && beforeExit());
    });
  });

  return function exitFunction(code) {
    pt.timeout(handler(), timeout)
      .then(() => {
        logger.info('[%s] beforeExit success', label);
        process.exit(code);
      })
      .catch(err => {
        logger.error('[%s] beforeExit fail, error: %s', label, err.message);
        process.exit(code);
      });
  };
};
