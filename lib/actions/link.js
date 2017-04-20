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
    // Extract: `/FULL/PATH/.../${prevName}/${baseName}`
    const prevName = path.basename(path.dirname(cwd));
    const baseName = path.basename(cwd);

    // At a `node_modules/@SCOPE_NAME` directory?
    const atScope = prevName === "node_modules" && baseName[0] === "@";
    const atModules = baseName === "node_modules";

    // LUT name helper
    const isMatch = (name) => !!linkMap[atScope ? `${baseName}/${name}` : name];

    // Check if at `node_modules`.
    if (atModules || atScope) {
      // Accumulate full path matches.
      const matches = files
        .filter(isMatch)
        .map((name) => path.join(cwd, name));

      // Traverse others further.
      return Promise.all(files // eslint-disable-line promise/no-nesting
        // Remove dot files and matches.
        .filter((name) => name && name[0] !== "." && !isMatch(name))
        // Recurse.
        .map((name) => find(linkMap, path.join(cwd, name)))
      )
        // Combine matches
        .then((recurseMatches) => [].concat(matches, recurseMatches));
    }

    // If there's a next level of `node_modules`, traverse it.
    if (files.indexOf("node_modules") > -1) {
      return find(linkMap, path.join(cwd, "node_modules"));
    }

    // Base case: we're done.
    return [];
  })
  // Allow not found for symlinks and weird thinks like `dep/node_modules/A_FILE.md`.
  .catch((err) => {
    if (err.code === "ENOENT" || err.code === "ENOTDIR") {
      return [];
    }
    throw err;
  })
  // Flatten nested arrays.
  .then(flatten);

// Simple log helper
const getLog = (fmt) => (msg) => {
  util._stdoutWrite(`${fmt({ color: "gray", key: "link", msg })}\n`);
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
    find(linkMap, path.join(util._cwd(), util.getSiblingPath(cfg), obj.module, "node_modules"))
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
