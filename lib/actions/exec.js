"use strict";

const path = require("path");
const exec = require("../util").exec;

/**
 * Exec a shell command in all / tagged projects.
 *
 * @param {Object}  cfg   configuration
 * @param {Object}  args  arguments
 * @return {Promise}      promise wrapping all executions
 */
module.exports = (cfg, args) => {
  const cmd = args.extra.join(" ");

  // Get tag filters, if any.
  const tags = args.tags.length && args.tags.reduce((acc, tag) => {
    acc[tag] = true;
    return acc;
  }, {});

  // Create all exec promises
  const execs = cfg
    // Filter to tags, if any.
    .filter((obj) => !tags || obj.tags.some((tag) => tags[tag]))
    // Run execs
    .map((obj) => exec(cmd, {
      cwd: path.resolve("..", obj.module)
    }, {
      proj: obj.module
    }));

  if (!execs.length) {
    throw new Error(`Found no matching projects. Tags: '${args.tags.join("', '")}'`);
  }

  // Execute in each project.
  return Promise.all(execs);
};
