[![Travis Status][trav_img]][trav_site]
[![Maintenance Status][maintenance-image]](#maintenance-status)


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

### Configuration File

Let's start with the first step - configuring project linking. To link projects,
you needs to create a `.lankrc.js` file. For an example set up of:

```sh
PROJECTS/
  one/
  two/
  three/
```

Say that you wish to run tasks from `PROJECTS/one`. You can create a
configuration file in either the controlling project directory, or one level
above, so:

If you would like to link the projects and run tasks from `PROJECTS`, then you
should create a:

```sh
PROJECTS/
  one/.lankrc.js
```

_or_

```sh
PROJECTS/.lankrc.js
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
  { module: "two", tags: "foo" },           // tags can be strings ...
  { module: "three", tags: ["foo", "bar"] } // ... or an array of strings
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

#### Scoped Modules

If your project has a scoped published name like `@org/foo`, then your directory
structure on disk must reflect that as well. So our example above may look
something instead like:

```sh
PROJECTS/
  @org/
    one/
    two/
    three/
```

with a `.lankrc.js` file of:

```js
module.exports = [
  "@org/one",
  "@org/two",
  "@org/three"
];
```

Unfortunately, the directory path of the actual module name is required, `@`
symbol and all.

Also note that for `.lankrc.js` resolution, the rules would be something like:

```sh
# If we're in `one`, look in CWD first.
PROJECTS/@org/one/.lankrc.js

# If not, look **two** levels down since we're in a scoped project.
PROJECTS/.lankrc.js
```

This scheme allows you to link both scoped and non-scoped projects in the same
directory structure.

## Running a Project

Workflows with `lank` circle around a root "controlling" project that you will
change directory into and run:

```sh
$ cd /PATH/TO/PROJECTS/one
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
/PATH/TO/PROJECTS/one/.lankrc.js
/PATH/TO/PROJECTS/.lankrc.js
```

So now, turning to the projects at hand, the core issue is cross-project
dependencies. In our example, they might look like this:

```
one/
  node_modules/
    two
      node_modules/
        three           # this dependency may be flattened to higher level
    three
two/
  node_modules/
    three
```

So, in this case `three` has no dependencies on the other projects, `two`
depends on `three`, and `one` (our control project) depends on at least `two`
and `three` and possibly a _second_ `three` as a transitive dependency of `two`.
Yowza.

### Linking Projects

So how do we "link" these projects together such that we can make a change in
`three` and see it reflected live in `one` and `two`? There are a couple of
approaches in the current ecosystem:

1. `npm link` the changed projects to each other.
2. Manually watch and recursively copy files from one project to another.
3. Manually `npm pack` and `npm install` packed tarballs on each change.

All of these approaches have drawbacks of some sort -- either relying on
symlinks, file watching / delayed copying, and/or manual steps. This adds up
to incorrect behavior or irksome developer workflows when changing things across
multiple project simultaneously.

`lank` takes a very different approach to this problem:

1. Find and delete all of the `npm install`-ed cross-project dependencies from
   each project's `node_modules`
2. Provide an execution wrapper that enhances the process environment such that
   the Node dependencies resolve to the "linked" live projects.

With this scheme in place, changes across projects are _instantaneous_ because
the real code in the linked project is used at the real path -- no symlinks or
file copying!

With that long introduction in place, we introduce `lank link`. What this
command basically does is find and delete all of the cross-project dependencies.
So, in our example, we first do a dry run to show what we would delete without
actually deleting:

```sh
$ lank link --dry-run
[lank:link]              Found 4 directories to delete:
[lank:link]              - /PATH/TO/PROJECTS/one/node_modules/two
[lank:link]              - /PATH/TO/PROJECTS/one/node_modules/two/node_modules/three
[lank:link]              - /PATH/TO/PROJECTS/one/node_modules/three
[lank:link]              - /PATH/TO/PROJECTS/two/node_modules/three
```

`lank` has traversed the dependency trees in all linked projects and found the
cross-dependencies. We then run `lank link` to actually perform the deletion.

If you want to _undo_ the linking, simply reinstall all projects' dependencies
with:

```sh
# Concurrent yarn installs are finicky, so install one at a time in serial.
# Also "force" the install as manually deleted packages from `lank` won't be
# necessarily reinstalled on a vanilla `yarn install` alone.
$ lank exec -s -- yarn install --force
# ... OR ...
$ lank exec -s -- npm install
```

### Shell Commands

Once you have `lank link`-ed a project, all projects effectively have "holes"
for cross-dependencies. We can use this to have the linked projects resolve to
each other in source by running any commands in one project with an environment
variables `NODE_PATH` that includes the value `..` which means "look one
directory below CWD to find additional dependencies". (See our section on Node
`require` resolution for a further explanation of this.)

To help with this environment enhancement and for similar multi-repository
workflows, `lank` provides the `exec` command, which runs the same command in
all linked projects:

```sh
$ lank exec -- SHELL_COMMAND
```

Here are some basic examples:

```sh
# Print CWD
$ lank exec -- pwd

# Git status
$ lank exec -- git status

# Install deps
$ lank exec -s -- yarn install --force
$ lank exec -s -- npm install
```

Sometimes, you only want to exec a command in some projects. This is where the
`-t, --tags <tags>` flag comes in handy to run based on arbitrary tags and the
`-m, --modules <modules>` flag is useful to limit to a list of named projects.

```sh
# Exec in projects configured with a (1) "foo" tag, (2) a "foo" or "bar" tag.
$ lank exec -t foo -- pwd
$ lank exec -t foo,bar -- pwd

# Exec in specifically named projects
$ lank exec -m one -- pwd
$ lank exec -m one,two -- pwd
```

#### Output Buffering

By default, `lank` buffers all output and displays it once the underyling
processes end. This is nice for processes that _do_ end since you don't get
random process output crossing streams in your terminal during execution. But,
this scheme doesn't really work well for `exec`'s that are meant to be
long-lived or persistent processes, such as a file build watch.

In these cases, use the `-u` / `--unbuffered` flag to just have output
splattered to stdout/stderr as it happens, with some helpful prefixes to
indicate which project the output came from. For example:

```sh
$ lank exec -u -- npm run watch-files
```

### Keeping Package Dependencies in Sync

Multiple repositories generally ends up with dependency skews across projects.
`lank` provides a very convenient manner of harmonizing dependencies across all
linked projects with:

```sh
$ lank deps -d  # Check with a dry run first.
$ lank deps
```

`lank` uses a simplistic algorithm of:

1. Only looking at deps that are of the forms `1.2.3`, `~1.2.3`, and `^1.2.3`
2. If 2+ different versions exist in a `package.json`, `lank` chooses the latest
   or highest version string to win.

`lank` then writes out updates to actual project `package.json` files where
applicable.

For a usual workflow, you'll want to update deps in linked projects, re-install
dependencies (and new ones), then re-link the projects. Something like:

```sh
# Update
$ lank deps

# Reinstall
$ lank exec -s -- yarn install --force
$ lank exec -s -- npm install

# Re-link
$ lank link
```

## Notes, Tips, and Tricks

### Miscellaneous

* The name of the Node modules must correspond to the directory name of the
  project on disk. For example, if you are linking the `foo` project normally
  found in `node_modules/foo`, it now _must_ be named `foo` on the local
  file system relative to the directories that `lank` controls.

### Node `require` Resolution

`lank` depends on the actual details of Node's `require` resolution, which is
a bit complicated and described in full detail at:
[https://nodejs.org/api/modules.html](https://nodejs.org/api/modules.html)

Here's an abbreviated example for us:

```js
# two/index.js
module.exports = require("three");
```

```js
# one/index.js
const two = require("two");

two("the transitive THREE command!");
```

The resolution of `three` from `two` has a large set of paths to traverse until
it finds a match.

```sh
# First, try `${dirname}/node_modules` and up file system
/home/user/projects/one/node_modules/two/node_modules/three
/home/user/projects/one/node_modules/three
/home/user/projects/node_modules/three
/home/user/node_modules/three
/home/node_modules/three
/node_modules/three

# Now, look to `NODE_PATH`
${NODE_PATH}/three

# Finally, the global installs
${HOME}/.node_modules/three
${HOME}/.node_libraries/three
${PREFIX}/lib/node/three
```

What `lank` does in `link`-ing is to just delete the normal projects from
`node_modules` and the in `exec` and related commands enhance the `NODE_PATH`
variable so that lookup up until `NODE_PATH` fails to find the cross-referenced
project. That then leaves `NODE_PATH` to get the live `link`-ed project instead
and **presto!** we have first class Node `require` integration with our custom
projects instead of what's installed via `yarn|npm install`.

### TODO(INITIAL) Additional Sections

* TODO(INITIAL): Document - webpack
* TODO(INITIAL): eslint

### Maintenance Status

**Stable:** Formidable is not planning to develop any new features for this project. We are still responding to bug reports and security concerns. We are still welcoming PRs for this project, but PRs that include new features should be small and easy to integrate and should not include breaking changes.

[trav_img]: https://api.travis-ci.org/FormidableLabs/lank.svg
[trav_site]: https://travis-ci.org/FormidableLabs/lank
[maintenance-image]: https://img.shields.io/badge/maintenance-stable-blue.svg
