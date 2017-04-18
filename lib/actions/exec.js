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
  const cmd = args.extra.join(" ").trim();
  if (!cmd) {
    throw new Error("A shell command must be provided like: 'lank exec -- pwd'");
  }

  // Create all exec promises
  const execs = cfg.map((obj) => exec(cmd, {
    cwd: path.resolve("..", obj.module)
  }, {
    proj: obj.module,
    cfg,
    dryRun: args.dryRun
  }));

  // Execute in each project.
  return Promise.all(execs);
};

module.exports.description = "Execute a shell command in all/tagged projects";
