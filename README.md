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

If you would like to link the projects and run tasks from `PROJECTS`, then you
should create a:

```sh
PROJECTS/.lankrc.js
```

However, this could be problematic if you want multiple `lank` controlled groups
of projects. The other alternative is to select the project that is the
"main control" project and place the rc file there. Say, for example `one`:

```sh
PROJECTS/
  one/.lankrc.js
```

On initialization, `lank` will look for a `.lankrc.js` in the current working
directory. If there is none, then `lank` will secondarily look up one directory
if it finds a `.lankrc.js` file. In either case, the project directories for all
linked files will be checked for presence, otherwise `lank` will throw a
configuration error.

#### Simple Version

The `.lankrc.js` file is simply an array of strings where each string
corresponds to the published `package.json:name` of a package _and_ is the name
of a directory at the same level as all other project directories controlled by
`lank`. For example:

```js
// `.lankrc.json`
[
  "one",
  "two",
  "three"
]

// `.lankrc.js`
module.exports = [
  "one",
  "two",
  "three"
];
```

#### Advanced Version

The `.lankrc.js` file can also be an object supporting the following fields:

- `module`: The string name of the module at issue.
- `tags`: A string for single tag or array of strings for multiple tags. Tags
  are used to filter multi-project commands.

`lank` supports two formats for advanced configuration objects - a longhand one:

```js
// `.lankrc.js`
module.exports = [
  { module: "one" },
  { module: "two", tags: "foo" },
  { module: "one", tags: ["foo", "bar"] }
];
```

and a shorthand object form:

```js
// `.lankrc.js`
module.exports = {
  one: {},
  two: { tags: "foo" },
  three: { tags: ["foo", "bar"] }
};
```

* TODO(INITIAL): Document examples of rc files.
* TODO(INITIAL): Add tests for logic of lankrc verification of projects
* TODO(INITIAL): Two lankrcs - (1) valid at both levels, (2) invalid at one lvl.

## Running a Project

Workflows with `lank` circle around a root "controlling" project that you will
change directory into and run:

```sh
$ cd /PATH/TO/PROJECTS/my_control_project
$ lank <commands>
```

`lank` will base working directory paths for all linked projects off this
assumption, and it will error out if it does not find a directory structure
that matches the configuration files.

**Side Note -- What is a "controlling" project?**: We use `lank` to control
2+ interrelated projects that need simultaneous changes. The controlling project
is usually the "most upstream" one that is not depended on by any other project.
For example, this would likely be your application that then "controls" many
linked library projects. Ultimately, it doesn't really matter that much as long
as the `lank` commands are executed from within the root project directory of
_any_ linked project.

As we learned above, that project must have a `.lankrc` file in one of:

```sh
/PATH/TO/PROJECTS/my_control_project/.lankrc.js
/PATH/TO/PROJECTS/.lankrc.js
```

The _other_ linked projects must be located at the same location as the control
project:

```sh
/PATH/TO/PROJECTS/my_control_project
/PATH/TO/PROJECTS/my_linked_project_01
/PATH/TO/PROJECTS/my_linked_project_02
```

### Workflow

* TODO(INITIAL): Document and implement exec's and tasks.
* TODO(INITIAL): Feature - multi `exec`

### Deleting

* TODO(INITIAL): Document and implement deleting.

### Shell Commands

* TODO(INITIAL): Document and implement deleting.

## Tips and Tricks

* The name of the Node modules must correspond to the directory name of the
  project on disk. For example, if you are linking the `foo` project normally
  found in `node_modules/foo`, it now _must_ be named `foo` on the local
  file system relative to the directories that `lank` controls.

* TODO(INITIAL): Document - webpack
* TODO(INITIAL): eslint
