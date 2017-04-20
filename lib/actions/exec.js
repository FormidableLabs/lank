"use strict";

const path = require("path");
const util = require("../util");

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
  const execs = cfg.map((obj) => () => util.exec(cmd, {
    cwd: path.join(util._cwd(), util.getSiblingPath(cfg), obj.module)
  }, {
    cfg,
    proj: obj.module,
    unbuffered: args.unbuffered,
    dryRun: args.dryRun
  }));

  // Execute in each project.
  return args.series ?
    execs.reduce((acc, func) => acc.then(func), Promise.resolve()) :
    Promise.all(execs.map((func) => func()));
};

module.exports.description = "Execute a shell command in all/tagged projects";
