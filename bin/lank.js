#!/usr/bin/env node
"use strict";

const opts = require("../lib/args").parse();

console.log("lank options: ", JSON.stringify(opts, null, 2)); // eslint-disable-line
