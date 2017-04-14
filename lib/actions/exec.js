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

  // Execute in each project.
  return Promise.all(cfg.map((obj) => {
    return exec(cmd, {
      cwd: path.resolve("..", obj.module)
    }, {
      proj: obj.module
    });
  }));
};
