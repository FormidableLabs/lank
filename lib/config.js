"use strict";

/**
 * Parse arguments for CLI.
 */
const fs = require("fs");
const path = require("path");
const requireOrNull = require("./util").requireOrNull;

// Name to require.
const LANKRC = ".lankrc";

const config = module.exports = {
  // Create a base configuration object.
  _createBaseConfig: (obj) => Object.assign({ module: "", tags: [] }, obj),

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

  // Validate object shape and surrounding file system and resolve where the
  // related directories are.
  _resolveDirectories: (cfg) => {
    if (!Array.isArray(cfg)) {
      throw new Error("Configuration data must be an array");
    }

    return Promise
      // Verify each config module has a corresponding directory.
      .all(cfg.map((obj) => new Promise((resolve, reject) => {

        // Resolve directories to sibling to PWD.
        const dir = path.resolve("..", obj.module);

        fs.stat(dir, (err, stat) => {
          if (err) {
            if (err.code === "ENOENT") {
              return void reject(new Error(`Linked directory ${dir} not found`));
            }
            return void reject(err);
          }

          if (!stat.isDirectory()) {
            return void reject(new Error(`Linked directory ${dir} is not a directory`));
          }

          resolve();
        });
      })))
      // Passthrough original config object if still valid.
      .then(() => cfg);
  },

  /**
   * Get configuration.
   *
   * @returns {Promise} Resolves to configuration object.
   */
  getConfig: () => new Promise((resolve, reject) => {
    // Get config file.
    // First try, `${PWD}/.lankrc.js`
    const cfg = requireOrNull(path.resolve(LANKRC)) ||
      // Then try, `${PWD}/../.lankrc.js`
      requireOrNull(path.resolve("..", LANKRC));

    if (!cfg) {
      return reject(new Error("Unable to find configuration data."));
    }

    return resolve(cfg);
  })
    // Normalize, validate configuration
    .then(config._normalizeConfig)
    .then(config._resolveDirectories)
};
