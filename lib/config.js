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
   * @returns {Object}        Configuration
   */
  config: () => {
    // Get config file.
    // First try, `${PWD}/.lankrc.js`
    // TODO(TEST): pwd resolve
    // TODO(TEST): pwd resolve json
    const cfg = requireOrNull(path.resolve(LANKRC)) ||
      // Then try, `${PWD}/../.lankrc.js`
      // TODO(TEST): pwd/.. resolve
      // TODO(TEST): pwd/.. resolve json
      requireOrNull(path.resolve("..", LANKRC));

    // TODO(TEST): empty config data / missing file
    if (!cfg) {
      throw new Error("Unable to find configuration data.");
    }

    // TODO: Validate shape of configuration object.
    // TODO(TEST): validation of shape of config object.

    return cfg;
  }
};
