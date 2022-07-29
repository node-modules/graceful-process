# graceful-process

graceful exit process even parent exit on SIGKILL.

[![NPM version](https://img.shields.io/npm/v/graceful-process.svg?style=flat-square)](https://npmjs.org/package/graceful-process)
[![NPM quality](http://npm.packagequality.com/shield/graceful-process.svg?style=flat-square)](http://packagequality.com/#?package=graceful-process)
[![NPM download](https://img.shields.io/npm/dm/graceful-process.svg?style=flat-square)](https://npmjs.org/package/graceful-process)

[![Continuous Integration](https://github.com/node-modules/graceful-process/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/graceful-process/actions/workflows/nodejs.yml)
[![Test coverage](https://img.shields.io/codecov/c/github/node-modules/graceful-process.svg?style=flat-square)](https://codecov.io/gh/node-modules/graceful-process)


## Install

```bash
npm i graceful-process --save
```

## Usage

Require this module and execute it on every child process file.

```js
// mycli.js
require('graceful-process')({ logger: console, label: 'mycli-child-cmd' });
```

## Support

- [x] cluster
- [x] child_process.fork()
- [ ] child_process.spawn()
