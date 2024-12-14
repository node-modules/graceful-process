/* eslint-disable @typescript-eslint/no-var-requires */
const { setTimeout: sleep } = require('node:timers/promises');

module.exports = async () => {
  console.log('process exiting');
  await sleep(1000);
  console.log('process exited');
};
