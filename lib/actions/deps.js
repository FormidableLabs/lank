"use strict";

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const pify = require("pify");
const readJson = pify(fs.readJson);
const writeJson = pify(fs.writeJson);
const semver = require("semver");

const util = require("../util");
const getFmt = util.getFmt;

// Helper to convert object to pairs of `[k, v]`
const toPairs = (obj) => Object.keys(obj).map((name) => ({ name,
  version: obj[name] }));

// Simple log helper
const getLog = (fmt) => (msg) => {
  util._stdoutWrite(`${fmt({ color: "gray",
    key: "deps",
    msg })}\n`);
};

// Update dependencies, if in map
const updateDeps = (depsObj, updateMap) => {
  if (!depsObj) { return null; }

  const updatedObj = Object.assign({}, depsObj);
  Object.keys(updatedObj).forEach((key) => {
    updatedObj[key] = updateMap[key] ? updateMap[key].winner : updatedObj[key];
  });

  return updatedObj;
};

// Create mega versions map.
const getDepsMap = (pkgs) => {
  // Create map of all dependencies.
  const allDepsMap = pkgs
    // Convert to array of combine prod/dev deps
    .map((pkg) => [].concat(
      toPairs(pkg.dependencies || {}),
      toPairs(pkg.devDependencies || {})
    ))
    // Flatten
    .reduce((acc, arr) => acc.concat(arr), [])
    // Accumulate into mega object.
    .reduce((acc, dep) => {
      // Start object with name.
      acc[dep.name] = acc[dep.name] || { name: dep.name };
      // Create set for efficient unique value storage. (Will convert to array later).
      acc[dep.name].versions = (acc[dep.name].versions || new Set()).add(dep.version);

      return acc;
    }, {});

  // Filter to things we need to actually change.
  const filteredDepsMap = Object.keys(allDepsMap)
    // Start by switching back to array of objects for filtering and swapping sets to arrays.
    .map((name) => ({
      name: allDepsMap[name].name,
      versions: Array.from(allDepsMap[name].versions)
    }))
    // Remove version single deps or all identical versions
    .filter((dep) => dep.versions.length > 1)
    // Handle only "easy" subset of dependencies: Those starting with `^~` or nothing.
    .filter((dep) => dep.versions.every((version) => (/^[\^\~0-9]/).test(version)))
    // Add "winning" version
    .map((dep) => Object.assign({
      // Take greatest version after ignoring prefix ^~ chars.
      winner: dep.versions.reduce((prev, cur) => {
        if (!prev) { return cur; }

        // Strip prefixes.
        const prevNum = prev.replace(/^[\^\~]/, "");
        const curNum = cur.replace(/^[\^\~]/, "");

        // If identical numbers, then choose >, then ~, then nothing.
        if (prevNum === curNum) {
          if (/^\^/.test(prev)) { return prev; }
          if (/^\^/.test(cur)) { return cur; }
          if (/^\~/.test(prev)) { return prev; }
          if (/^\~/.test(cur)) { return cur; }

          // Identical *and* pinned.
          return prev;
        }

        // Semver diff.
        return semver.gt(prevNum, curNum) ? prev : cur;
      }, null)
    }, dep))
    // ... and back to object!
    .reduce((acc, dep) => Object.assign({ [dep.name]: dep }, acc), {});

  return filteredDepsMap;
};

/**
 * Harmonize all deps found in 2+ projects to latest semver-version.
 *
 * Write updated `package.json` files in all projects
 *
 * @param {Object}  cfg   configuration
 * @param {Object}  args  arguments
 * @return {Promise}      promise wrapping all changes
 */
module.exports = (cfg, args) => {
  const log = args.quiet ? () => {} : getLog(getFmt(cfg));
  const isDryRun = args.dryRun;

  // Get all project package.json files.
  const getPkgs = cfg.projs.map((obj) => readJson(
    path.join(util._cwd(), util.getSiblingPath(cfg), obj.module, "package.json")
  ));

  // Write packages out.
  const writePkgs = (pkgs) => pkgs.map((pkg) => writeJson(
    path.join(util._cwd(), util.getSiblingPath(cfg), pkg.name, "package.json"),
    pkg,
    { spaces: 2 }
  ));

  return Promise.all(getPkgs)
    .then((pkgs) => {
      // Convert to map.
      const depsMap = getDepsMap(pkgs);
      const keys = Object.keys(depsMap);

      log(`Found ${keys.length} dependencies to harmonize:`);
      keys.forEach((key) => {
        const dep = depsMap[key];
        const versions = dep.versions.map((v) => chalk.gray(v)).join(", ");
        log(`- ${chalk.cyan(key)}: ${chalk.red(dep.winner)} (${versions})`);
      });

      if (isDryRun) {
        log(chalk.yellow("Dry run - skipping package.json updates"));
        return Promise.resolve();
      }

      // Mutate original packages.
      const updatedPkgs = pkgs.map((pkg) => {
        const dependencies = updateDeps(pkg.dependencies, depsMap);
        const devDependencies = updateDeps(pkg.devDependencies, depsMap);

        return Object.assign({}, pkg,
          dependencies ? { dependencies } : {},
          devDependencies ? { devDependencies } : {}
        );
      });

      log(chalk.yellow("Updating package.json files"));
      return Promise.all(writePkgs(updatedPkgs));
    });
};

module.exports.description = "Harmonize / update dependencies in all project package.json files";
