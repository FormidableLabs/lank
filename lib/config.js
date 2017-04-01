"use strict";

/**
 * Parse arguments for CLI.
 */
const path = require("path");
const requireOrNull = require("./util").requireOrNull;

// Name to require.
const LANKRC = ".lankrc";

const config = module.exports = {
  // Create a base configuration object.
  _baseConfig: (obj) => Object.assign({ module: "", tags: [] }, obj),

  // Convert configuration to canonical `{ module, tags }` format.
  _normalizeConfig: (cfg) => {
    if (!cfg) { return []; }

    // Normalize strings to objects.
    if (Array.isArray(cfg)) {
      return cfg
        .map((o) => typeof o === "string" ? { module: o } : o)
        .map(config._baseConfig);
    }

    // Normalize objects to array.
    return Object.keys(cfg)
      .map((k) => Object.assign({ module: k }, cfg[k]))
      .map(config._baseConfig);
  },

  // Validate object shape and surrounding file system.
  _validateConfig: (cfg) => {
    if (!Array.isArray(cfg)) {
      throw new Error("Configuration data must be an array");
    }

    console.log("TODO HERE: Implement fs validation");

    return cfg;
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
    .then(config._validateConfig)
};
