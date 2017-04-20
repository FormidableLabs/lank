"use strict";

/**
 * Parse arguments for CLI.
 */
const fs = require("fs-extra");
const path = require("path");
const pify = require("pify");
const stat = pify(fs.stat);
const util = require("./util");
const requireOrNull = util.requireOrNull;

// Name to require.
const LANKRC = ".lankrc";

const config = module.exports = {
  // Create a base configuration object.
  _createBaseConfig: (obj) => {
    const cfg = Object.assign({ module: "", tags: [] }, obj);

    // Coerce tags string to array.
    if (typeof cfg.tags === "string") {
      cfg.tags = [cfg.tags];
    }

    return cfg;
  },

  // Convert configuration to canonical `{ module, tags }` format.
  _normalizeConfig: (cfg) => {
    if (!cfg) { return []; }

    // Normalize strings to objects.
    if (Array.isArray(cfg)) {
      return cfg
        .map((obj) => typeof obj === "string" ? { module: obj } : obj)
        .map(config._createBaseConfig);
    }

    // Normalize objects to array.
    return Object.keys(cfg)
      .map((k) => Object.assign({ module: k }, cfg[k]))
      .map(config._createBaseConfig);
  },

  // Validate that we are _in_ a linked project.
  _validateControllingProject: (cfg) => {
    const name = (requireOrNull(path.join(util._cwd(), "package.json")) || {}).name;
    if (!name) {
      throw new Error("Unable to read controlling project package.json:name");
    }

    if (!cfg.some((obj) => obj.module === name)) {
      throw new Error("Controlling project (CWD) must be part of configuration");
    }

    return cfg;
  },

  // Validate object shape and surrounding file system and resolve where the
  // related directories are.
  _resolveDirectories: (cfg) => Promise
    // Verify each config module has a corresponding directory.
    .all(cfg.map((obj) => {
      // Resolve directories to sibling to PWD.
      const dir = path.join(util._cwd(), "..", obj.module);

      return stat(dir)
        .then((data) => {
          if (!data.isDirectory()) { // eslint-disable-line promise/always-return
            throw new Error(`Linked directory ${dir} is not a directory`);
          }
        })
        .catch((err) => {
          if (err.code === "ENOENT") {
            throw new Error(`Linked directory ${dir} not found`);
          }

          throw err;
        });
    }))
    // Passthrough original config object if still valid.
    .then(() => cfg),

  /**
   * Get configuration.
   *
   * @returns {Promise} Resolves to configuration object.
   */
  getConfig: () => new Promise((resolve, reject) => { // eslint-disable-line promise/avoid-new
    // Get config file.
    // First try, `${PWD}/.lankrc.js`
    const cfg = requireOrNull(path.join(util._cwd(), LANKRC)) ||
      // Then try, `${PWD}/../.lankrc.js`
      requireOrNull(path.join(util._cwd(), "..", LANKRC));

    if (!cfg) {
      return reject(new Error("Unable to find configuration data."));
    }

    return resolve(cfg);
  })
    // Normalize, validate configuration
    .then(config._normalizeConfig)
    .then(config._validateControllingProject)
    .then(config._resolveDirectories)
};
