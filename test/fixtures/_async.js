'use strict';

const sleep = require('mz-modules/sleep');

module.exports = async () => {
  console.log('process exiting');
  await sleep(1000);
  console.log('process exited');
};
