#!/usr/bin/env node
"use strict";

const parse = require("../lib/args").parse;
const getConfig = require("../lib/config").getConfig;
const getFmt = require("../lib/util").getFmt;

const main = module.exports = (argv) => {
  const args = parse(argv);
  const action = (args || {}).action || (() => {});
  let cfg;

  // Get configuration.
  return getConfig()
    // Stash config, run action.
    .then((cfgObj) => {
      cfg = cfgObj;
      return action(cfg, args);
    })
    // Return config, args.
    .then(() => ({ cfg, args }));
};

if (require.main === module) {
  main()
    /*eslint-disable*/
    .then((obj) => {
      const fmt = getFmt(obj.cfg);
      console.log(fmt({
        color: "cyan", key: "main", msg: `TODO DEBUG ARGS, CFG:\n${JSON.stringify(obj, null, 2)}`
      }));
    })
    /*eslint-enable*/
    .catch((err) => {
      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
