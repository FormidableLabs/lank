"use strict";

/**
 * Parse arguments for CLI.
 */
const path = require("path");

// Name to require.
const LANKRC = ".lankrc";
const config = module.exports;

// Stubbable method for requires.
config._require = require;

const loadConfig = (cfgPath) => {
  try {
    return config._require(cfgPath);
  } catch (err) {
    return null;
  }
};

/**
 * Get configuration.
 *
 * @returns {Object}        Configuration
 */
config.config = () => {
  // Get config file.
  // First try, `${PWD}/.lankrc.js`
  const cfg = loadConfig(path.resolve(LANKRC)) ||
    // Then try, `${PWD}/../.lankrc.js`
    loadConfig(path.resolve("..", LANKRC));

  if (!cfg) {
    throw new Error("Unable to find configuration data.");
  }

  // TODO: Validate shape of configuration object.

  return cfg;
};
