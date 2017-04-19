#!/usr/bin/env node
"use strict";

const chalk = require("chalk");

const argsMod = require("../lib/args");
const getConfig = require("../lib/config").getConfig;

const util = require("../lib/util");
const getFmt = util.getFmt;
let fmt = (args) => JSON.stringify(args);

const ARGS_IDX = 2; // index where cli arguments start

const main = module.exports = (argv) => {
  const args = argsMod.parse(argv) || {};
  const action = args.action || (() => {});
  const tags = args.tags || [];
  const mods = args.mods || [];

  let cfg;

  // Get configuration.
  return getConfig()
    // Stash config, run action.
    .then((rawCfg) => {
      // Process and stash configs + formatter.
      cfg = (rawCfg || [])
        // Filter to tags.
        .filter((obj) => !tags.length || obj.tags.some((tag) => tags.indexOf(tag) > -1))
        // Filter to modules.
        .filter((obj) => !mods.length || mods.indexOf(obj.module) > -1);

      fmt = getFmt(cfg);
      if (!cfg.length) {
        const tagsMsg = `Tags: '${tags.join("', '")}'.`;
        const modsMsg = `Modules: '${mods.join("', '")}'.`;
        throw new Error(`Found no matching projects. ${tagsMsg} ${modsMsg}`);
      }

      return action(cfg, args);
    })
    // Ensure we've closed listeners, then return config, args.
    .then(() => {
      argsMod.close();
      return { cfg, args };
    })
    .catch((err) => {
      argsMod.close();
      throw err;
    });
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
