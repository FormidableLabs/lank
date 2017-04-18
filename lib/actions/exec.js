"use strict";

const path = require("path");
const util = require("../util");
const exec = util.exec;
const filterTags = util.filterTags;

/**
 * Exec a shell command in all / tagged projects.
 *
 * @param {Object}  cfg   configuration
 * @param {Object}  args  arguments
 * @return {Promise}      promise wrapping all executions
 */
module.exports = (cfg, args) => {
  const cmd = args.extra.join(" ");

  // Create all exec promises
  const execs = cfg
    // Filter to tags, if any.
    .filter(filterTags(args.tags))
    // Run execs
    .map((obj) => exec(cmd, {
      cwd: path.resolve("..", obj.module)
    }, {
      proj: obj.module,
      cfg
    }));

  if (!execs.length) {
    throw new Error(`Found no matching projects. Tags: '${args.tags.join("', '")}'`);
  }

  // Execute in each project.
  return Promise.all(execs);
};

module.exports.description = "Execute a shell command in all/tagged projects";
