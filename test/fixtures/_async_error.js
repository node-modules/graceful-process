'use strict';

const sleep = require('mz-modules/sleep');

module.exports = async () => {
  await sleep(1000);
  throw new Error('reject');
};
