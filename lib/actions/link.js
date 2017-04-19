"use strict";

const chalk = require("chalk");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const pify = require("pify");
const readdir = pify(fs.readdir);
const remove = pify(fs.remove);

const util = require("../util");
const getFmt = util.getFmt;
const flatten = (arrs) => arrs.reduce((acc, arr) => acc.concat(arr), []);

// Recursively find files from config.
const find = (linkMap, cwd) => readdir(cwd)
  // Traverse matches
  .then((files) => {
    // If we're not node_modules, check for a further node_modules.
    if (path.basename(cwd) !== "node_modules") {
      if (files.indexOf("node_modules") > -1) {
        // If there's a next level of `node_modules`, traverse it.
        return find(linkMap, path.resolve(cwd, "node_modules"));
      } else {
        // Base case: we're done.
        return [];
      }
    }

    // Accumulate full path matches.
    const matches = files
      .filter((name) => linkMap[name])
      .map((name) => path.resolve(cwd, name));

    // Traverse others further.
    return Promise.all(files // eslint-disable-line promise/no-nesting
      // Remove dot files and matches.
      .filter((name) => name && name[0] !== "." && !linkMap[name])
      // Recurse.
      .map((name) => find(linkMap, path.resolve(cwd, name)))
    )
      // Combine matches
      .then((recurseMatches) => [].concat(matches, recurseMatches));
  })
  // Allow not found for symlinks and such.
  .catch((err) => {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  })
  // Flatten nested arrays.
  .then(flatten);

// Simple log helper
const getLog = (fmt) => (msg) => {
  util._stdoutWrite(`${fmt({
    color: "gray", key: "link", msg
  })}\n`);
};

/**
 * Find and delete "linked" projects from `node_modules`
 *
 * @param {Object}  cfg   configuration
 * @param {Object}  args  arguments
 * @return {Promise}      promise wrapping all executions
 */
module.exports = (cfg, args) => {
  const log = getLog(getFmt(cfg));
  const isDryRun = args.dryRun;

  // Create lookup table of projects to link.
  const linkMap = cfg.reduce((acc, obj) => Object.assign(acc, { [obj.module]: true }), {});

  // Execute in each project.
  return Promise.all(cfg.map((obj) =>
    find(linkMap, path.resolve(path.join("..", obj.module, "node_modules")))
  ))
    // Flatten nested arrays.
    .then(flatten)
    // Link (delete).
    .then((files) => {
      const filesList = files.length ? [""].concat(files).join(`${os.EOL}- `) : "";
      log(`Found ${files.length} directories to delete: ${filesList}`);

      if (isDryRun) {
        log(chalk.yellow("Dry run - skipping deletes"));
        return Promise.resolve();
      }

      log(chalk.yellow("Deleting linked dependencies"));
      return Promise.all(files.map((file) => remove(file)));
    });
};

module.exports.description = "Delete ('link') controlled projects from node_modules";
