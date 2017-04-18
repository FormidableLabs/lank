"use strict";

const fs = require("fs");
const path = require("path");
const pify = require("pify");
const readdir = pify(fs.readdir);

const filterTags = require("../util").filterTags;

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
  .then((files) => files.reduce((acc, arr) => acc.concat(arr), []));

/**
 * Find and delete "linked" projects from `node_modules`
 *
 * @param {Object}  cfg   configuration
 * @param {Object}  args  arguments
 * @return {Promise}      promise wrapping all executions
 */
module.exports = (cfg, args) => {
  // Create lookup table of projects to link.
  const linkMap = cfg
    // Filter to tags, if any.
    .filter(filterTags(args.tags))
    // Simple LUT
    .reduce((acc, obj) => Object.assign(acc, { [obj.module]: true }), {});

  // Execute in each project.
  return Promise.all(cfg.map((obj) =>
    find(linkMap, path.resolve(path.join("..", obj.module, "node_modules")))
      .then((args) => { // eslint-disable-line
        // TODO HERE: Add `fs-extra`.
        console.log("TODO HERE FIND", obj.module, args); // eslint-disable-line
      })
  ));
};

module.exports.description = "Delete ('link') controlled projects from node_modules";
