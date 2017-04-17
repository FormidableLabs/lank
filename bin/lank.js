#!/usr/bin/env node
"use strict";

const parse = require("../lib/args").parse;
const getConfig = require("../lib/config").getConfig;
const fmt = require("../lib/util").fmt;

const main = module.exports = (argv) => {
  const args = parse(argv);
  const action = (args || {}).action || (() => {});

  // Get configuration.
  return getConfig()
    // Run action, return args, configuration.
    .then((cfg) => {
      action(cfg, args);
      return { cfg, args };
    });
};

if (require.main === module) {
  main()
    .then((obj) => { // eslint-disable-line
      console.log(fmt("cyan", "lank", "main", JSON.stringify(obj, null, 2))); // eslint-disable-line
    })
    .catch((err) => {
      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
