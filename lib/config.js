"use strict";

/**
 * Parse arguments for CLI.
 */
const path = require("path");
const requireOrNull = require("./util").requireOrNull;

// Name to require.
const LANKRC = ".lankrc";

module.exports = {
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

    // TODO: Validate shape of configuration object.
    // TODO(TEST): validation of shape of config object.

    return resolve(cfg);
  })
};
