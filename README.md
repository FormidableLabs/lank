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

## Installation

Install `lank` globally:

```sh
$ npm install -g lank
$ yarn global add lank
```

## Configuration

The first basic step with `lank` is "linking" several projects together. This
really means:

1. `lank` has some means of knowing _which_ projects are connected --
   accomplished by a `.lankrc.js` file.
2. `lank` then provides helper tasks to delete linked projects from withing
   each project's `node_modules` dependency tree.
3. Things are now set up file-wise. The final aspect is that `lank` provides
   execution helpers to set up `NODE_PATH` for proper inter-project resolution
   while invoking (1) multi / "all project" tasks and (2) central "project under
   development" tasks. This last step is optional as a user can just mutate
   `NODE_PATH` on their own and run manual steps.

### Linking

Let's start with the first step - linking. To link projects, you needs to
create a `.lankrc.js` file. For an example set up of:

```sh
PROJECTS/
  one/
  two/
  three/
```

If you would like to link the projects and run tasks from `PROJECT`, then you
should create a:

```sh
PROJECT/.lankrc.js
```

However, this could be problematic if you want multiple `lank` controlled groups
of projects. The other alternative is to select the project that is the
"main control" project and place the rc file there. Say, for example `one`:

```sh
PROJECT/
  one/.lankrc.js
```

On initialization, `lank` will look for a `.lankrc.js` in the current working
directory. If there is none, then `lank` will secondarily look up one directory
if it finds a `.lankrc.js` file. In either case, the project directories for all
linked files will be checked for presence, otherwise `lank` will throw a
configuration error.

* TODO(INITIAL): Feature - `${PWD}/.lankrc`, `${PWD}/../.lankrc`
* TODO(INITIAL): Document examples of rc files.
* TODO(INITIAL): Add tests for logic of lankrc traversal
* TODO(INITIAL): Add tests for logic of lankrc verification of projects
* TODO(INITIAL): Two lankrcs - (1) valid at both levels, (2) invalid at one lvl.

### Deleting

* TODO(INITIAL): Document and implement deleting.

### Workflow

* TODO(INITIAL): Document and implement exec's and tasks.
* TODO(INITIAL): Feature - multi `exec`

## Tips and Tricks

* TODO(INITIAL): package.json - node engines restrictions
* TODO(INITIAL): Document - webpack
* TODO(INITIAL): eslint
