#!/usr/bin/env node
"use strict";

const opts = require("../lib/args").parse();
const config = require("../lib/config").config();

const main = () => {
  console.log("TODO: lank setup: ", JSON.stringify({ // eslint-disable-line
    opts,
    config
  }, null, 2)); // eslint-disable-line
};

if (require.main === module) {
  main();
}
