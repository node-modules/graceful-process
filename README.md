# graceful-process

[![NPM version](https://img.shields.io/npm/v/graceful-process.svg?style=flat-square)](https://npmjs.org/package/graceful-process)
[![NPM quality](http://npm.packagequality.com/shield/graceful-process.svg?style=flat-square)](http://packagequality.com/#?package=graceful-process)
[![NPM download](https://img.shields.io/npm/dm/graceful-process.svg?style=flat-square)](https://npmjs.org/package/graceful-process)
[![Node.js Version](https://img.shields.io/node/v/graceful-process.svg?style=flat)](https://nodejs.org/en/download/)
[![Continuous Integration](https://github.com/node-modules/graceful-process/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/graceful-process/actions/workflows/nodejs.yml)
[![Test coverage](https://img.shields.io/codecov/c/github/node-modules/graceful-process.svg?style=flat-square)](https://codecov.io/gh/node-modules/graceful-process)

graceful exit process even parent exit on SIGKILL.

## Install

```bash
npm i graceful-process
```

## Usage

Require this module and execute it on every child process file.

```js
// mycli.js
const { graceful } = require('graceful-process');

graceful({ logger: console, label: 'mycli-child-cmd' });
```

## Support

- [x] cluster
- [x] child_process.fork()
- [ ] child_process.spawn()

## Contributors

[![Contributors](https://contrib.rocks/image?repo={group/repo})](https://github.com/{group/repo}/graphs/contributors)

Made with [contributors-img](https://contrib.rocks).
