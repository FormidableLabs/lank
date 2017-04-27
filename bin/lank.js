#!/usr/bin/env node
"use strict";

const chalk = require("chalk");

const argsMod = require("../lib/args");
const getConfig = require("../lib/config").getConfig;

const util = require("../lib/util");
const getFmt = util.getFmt;
const noop = () => {};
let fmt = (obj) => getFmt()(obj); // Default if early error.
let write = (msg) => util._stdoutWrite(`${fmt(msg)}\n`);

const ARGS_IDX = 2; // index where cli arguments start

const main = module.exports = (argv) => {
  const args = argsMod.parse(argv) || {};
  const action = args.action || noop;
  const tags = args.tags || [];
  const mods = args.mods || [];

  // Silence output if set.
  write = args.quiet ? noop : write;

  // Get configuration.
  let cfg;
  return getConfig()
    // Stash config, run action.
    .then((rawCfg) => {
      // Process and stash configs + formatter.
      cfg = Object.assign({}, rawCfg, {
        projs: (rawCfg.projs || [])
          // Filter to tags.
          .filter((obj) => !tags.length || obj.tags.some((tag) => tags.indexOf(tag) > -1))
          // Filter to modules.
          .filter((obj) => !mods.length || mods.indexOf(obj.module) > -1)
      });

      fmt = getFmt(cfg);
      if (!cfg.projs.length) {
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
    .then(() => { // eslint-disable-line promise/always-return
      write({
        color: "cyan", key: "main", msg: "Done."
      });
    })
    .catch((err) => {
      const cmd = chalk.gray([].concat(
        "lank",
        process.argv.slice(ARGS_IDX)).join(" ")
      );
      write({
        color: "red", key: "main", msg: `Command failed: ${cmd}\n`
      });

      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
