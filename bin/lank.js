#!/usr/bin/env node
"use strict";

const opts = require("../lib/args").parse();
const config = require("../lib/config");

const main = module.exports = () => {
  return config.getConfig()
    .then((cfg) => {
      console.log("TODO: lank setup: ", JSON.stringify({ // eslint-disable-line
        opts,
        cfg
      }, null, 2)); // eslint-disable-line
    });
};

if (require.main === module) {
  main()
    .catch((err) => {
      // Try to get full stack, then full string if not.
      console.error(err.stack || err.toString()); // eslint-disable-line no-console
      process.exit(1); // eslint-disable-line no-process-exit
    });
}
