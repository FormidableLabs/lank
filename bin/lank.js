#!/usr/bin/env node
"use strict";

const parse = require("../lib/args").parse;
const config = require("../lib/config");

const main = module.exports = (argv) => {
  const args = parse(argv);

  return config.getConfig()
    .then((cfg) => ({ args, cfg }));
};

if (require.main === module) {
  main()
    .then((obj) => {
      console.log("TODO: lank setup: ", obj); // eslint-disable-line
    })
    .catch((err) => {
      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
