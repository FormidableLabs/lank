lank
====

Working on multiple repositories that depend on each other can be a real pain.
`npm link`-ing often has limitations. Watching and copying files from one
project to another has lag and is often wonky.

Lank enters this space with a simple proposition: **do nothing**.

More specifically:

1. Take a nested, interrelated dependency tree and delete any projects that you
   would like to simultaneously edit from `node_modules` in each project.
2. Add `NODE_PATH` enhancements to allow
   [Node.js `require` resolution](https://nodejs.org/api/modules.html) to
   resolve to the actual checked out projects _instead_ of installed
   `node_modules` dependencies.

## Tasks

* TODO: package.json - node engines restrictions
* TODO: Feature - multi `exec`
* TODO: Feature - `${PWD}/.lankrc`, `${PWD}/../.lankrc`
* TODO: Document - webpack
* TODO: eslint
