/* eslint-disable @typescript-eslint/no-var-requires */
const { setTimeout: sleep } = require('node:timers/promises');

module.exports = async () => {
  await sleep(1000);
  throw new Error('reject');
};
