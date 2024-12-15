# Changelog

## [2.0.0](https://github.com/node-modules/graceful-process/compare/v1.2.0...v2.0.0) (2024-12-15)


### ⚠ BREAKING CHANGES

* drop Node.js < 18.19.0 support

part of https://github.com/eggjs/egg/issues/3644

https://github.com/eggjs/egg/issues/5257

<!-- This is an auto-generated comment: release notes by coderabbit.ai
-->
## Summary by CodeRabbit

## Release Notes

- **New Features**
- Introduced new GitHub Actions workflows for publishing and release
processes.
- Added TypeScript configuration for stricter type-checking and modern
module support.
  - New exit handler functionality for graceful application termination.

- **Documentation**
- Updated README.md for clarity on usage and installation instructions.
  
- **Bug Fixes**
  - Improved error handling and logging in the exit process.

- **Chores**
- Updated `.gitignore` and `package.json` to reflect new structure and
dependencies.
  - Modified CI pipeline to use updated Node.js versions.
<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### Features

* support cjs and esm both by tshy ([#8](https://github.com/node-modules/graceful-process/issues/8)) ([a31a80e](https://github.com/node-modules/graceful-process/commit/a31a80e76480ada98ff73a5c57a52c7602d0d32a))
* support timeout && drop node 14 support ([#6](https://github.com/node-modules/graceful-process/issues/6)) ([8551bae](https://github.com/node-modules/graceful-process/commit/8551baef2c2bc49e9e36fe95830f8a90668fbe08))

1.2.0 / 2018-03-02
==================

**features**
  * [[`0f0069c`](http://github.com/node-modules/graceful-process/commit/0f0069cb5f97ae1f4f6c80b0b6f5d5f7e6f9ae4c)] - feat: add beforeExit options (#4) (Haoliang Gao <<sakura9515@gmail.com>>)

1.1.0 / 2018-01-17
==================

**features**
  * [[`180028b`](http://github.com/node-modules/graceful-process/commit/180028be79b2d55ac3142e24b272f7552f3bbb25)] - feat: add logLevel to control print log level (#3) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`7edd157`](http://github.com/node-modules/graceful-process/commit/7edd1578ad15264b1e7e8395ffbeb174865694e6)] - test: add more assert on tests (#2) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`b838376`](http://github.com/node-modules/graceful-process/commit/b838376b42a239c9d8a61a4e3ce0b167d327119b)] - deps: use nyc version of egg-bin (#1) (fengmk2 <<fengmk2@gmail.com>>)

1.0.0 / 2017-06-12
==================

  * first release
