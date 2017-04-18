#!/usr/bin/env node
"use strict";

const chalk = require("chalk");

const parse = require("../lib/args").parse;
const getConfig = require("../lib/config").getConfig;

const util = require("../lib/util");
const getFmt = util.getFmt;
const filterTags = util.filterTags;
let fmt = (args) => JSON.stringify(args);

const ARGS_IDX = 2; // index where cli arguments start

const main = module.exports = (argv) => {
  const args = parse(argv) || {};
  const action = args.action || (() => {});
  let cfg;

  // Get configuration.
  return getConfig()
    // Stash config, run action.
    .then((rawCfg) => {
      // Process and stash configs + formatter.
      cfg = (rawCfg || []).filter(filterTags(args.tags));
      fmt = getFmt(cfg);
      if (!cfg.length) {
        throw new Error(`Found no matching projects. Tags: '${args.tags.join("', '")}'`);
      }

      return action(cfg, args);
    })
    // Return config, args.
    .then(() => ({ cfg, args }));
};

if (require.main === module) {
  main()
    /*eslint-disable*/
    .then((obj) => {
      console.log(fmt({
        color: "cyan", key: "main", msg: `TODO DEBUG: ${JSON.stringify(obj)}`
      }));
    })
    /*eslint-enable*/
    .catch((err) => {
      const cmd = chalk.gray([].concat(
        "lank",
        process.argv.slice(ARGS_IDX)).join(" ")
      );
      console.log(fmt({ // eslint-disable-line no-console
        color: "red", key: "main", msg: `Command failed: ${cmd}`
      }));

      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
