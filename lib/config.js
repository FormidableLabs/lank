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
    const proj = Object.assign({ module: "",
      tags: [] }, obj);

    // Coerce tags string to array.
    if (typeof proj.tags === "string") {
      proj.tags = [proj.tags];
    }

    // Other normalizations
    proj.module = proj.module.trim();

    return proj;
  },

  // Convert configuration to canonical `{ module, tags }` format.
  _normalizeProjects: (projs) => {
    if (!projs) { return []; }

    // Normalize strings to objects.
    if (Array.isArray(projs)) {
      return projs
        .map((obj) => typeof obj === "string" ? { module: obj } : obj)
        .map(config._createBaseConfig);
    }

    // Normalize objects to array.
    return Object.keys(projs)
      .map((k) => Object.assign({ module: k }, projs[k]))
      .map(config._createBaseConfig);
  },

  // Validate that we are _in_ a linked project and enhance config object.
  _getControllingModule: (name, siblingPath, projs) => {
    const control = projs.find((obj) => obj.module === name);
    if (!control) {
      throw new Error("Controlling project (CWD) must be part of configuration");
    }

    return {
      module: control.module,
      siblingPath
    };
  },

  // Validate object shape and surrounding file system and resolve where the
  // related directories are.
  _resolveDirectories: (cfg) => Promise
    // Verify each config module has a corresponding directory.
    .all(cfg.projs.map((obj) => {
      // Resolve directories to sibling to controlling project.
      const dir = path.join(util._cwd(), cfg.control.siblingPath, obj.module);

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
    let projs = requireOrNull(path.join(util._cwd(), LANKRC))
      // Then try, `${PWD}/(..|../..)/.lankrc.js`
      || requireOrNull(path.join(util._cwd(), siblingPath, LANKRC));

    if (!projs) {
      return Promise.reject(new Error("Unable to find configuration data."));
    }

    // Normalize, validate configuration
    let cfg;
    try {
      projs = config._normalizeProjects(projs);
      cfg = {
        projs,
        control: config._getControllingModule(name, siblingPath, projs)
      };
    } catch (err) {
      return Promise.reject(err);
    }

    return config._resolveDirectories(cfg);
  }
};
