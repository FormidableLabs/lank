#!/usr/bin/env node
"use strict";

const parse = require("../lib/args").parse;
const getConfig = require("../lib/config").getConfig;
const actions = require("../lib/actions");
const fmt = require("../lib/util").fmt;

const main = module.exports = (argv) => {
  const args = parse(argv);
  let cfg;

  return getConfig()
    // Get configuration.
    .then((resolvedCfg) => { cfg = resolvedCfg; })
    // Run action.
    .then(() => {
      // No action invokes help, so skip here.
      // (If in tests -- normally we've already process.exit()-ed).
      if (!args.action) { return null; }

      // Get action.
      const action = actions[args.action];
      if (!action) {
        throw new Error(`Unrecognized action: '${args.action}'`);
      }

      return action(cfg, args);
    })
    // Return args, configuration.
    .then(() => ({ cfg, args }));
};

if (require.main === module) {
  main()
    .then((obj) => {
      console.log(fmt("cyan", "lank", "main", JSON.stringify(obj, null, 2))); // eslint-disable-line
    })
    .catch((err) => {
      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
