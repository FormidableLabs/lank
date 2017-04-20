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
const getSiblingPath = util.getSiblingPath;

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

    // Other normalizations
    cfg.module = cfg.module.trim();

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

  // Validate that we are _in_ a linked project and enhance config object.
  _getControllingModule: (name, siblingPath, cfg) => {
    const control = cfg.find((obj) => obj.module === name);
    if (!control) {
      throw new Error("Controlling project (CWD) must be part of configuration");
    }

    // Mutate array object itself with properties.
    control._lank = {
      control: true,
      siblingPath
    };

    return cfg;
  },

  // Validate object shape and surrounding file system and resolve where the
  // related directories are.
  _resolveDirectories: (cfg) => Promise
    // Verify each config module has a corresponding directory.
    .all(cfg.map((obj) => {
      // Resolve directories to sibling to controlling project.
      const dir = path.join(util._cwd(), getSiblingPath(cfg), obj.module);

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
  getConfig: () => {
    // Need the name of our project first.
    const name = (requireOrNull(path.join(util._cwd(), "package.json")) || {}).name;
    if (!name) {
      return Promise.reject(new Error("Unable to read controlling project package.json:name"));
    }

    // relative path to other projects - scoped vs. normal.
    const siblingPath = name[0] === "@" ? "../.." : "..";

    // Get config file.
    // First try, `${PWD}/.lankrc.js`
    let cfg = requireOrNull(path.join(util._cwd(), LANKRC)) ||
      // Then try, `${PWD}/(..|../..)/.lankrc.js`
      requireOrNull(path.join(util._cwd(), siblingPath, LANKRC));

    if (!cfg) {
      return Promise.reject(new Error("Unable to find configuration data."));
    }

    // Normalize, validate configuration
    try {
      cfg = config._normalizeConfig(cfg);
      cfg = config._getControllingModule(name, siblingPath, cfg);
    } catch (err) {
      return Promise.reject(err);
    }

    return config._resolveDirectories(cfg);
  }
};
