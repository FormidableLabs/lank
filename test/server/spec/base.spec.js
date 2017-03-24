"use strict";

/**
 * Base server unit test initialization / global before/after's.
 *
 * This file should be `require`'ed by all other test files.
 *
 * **Note**: Because there is a global sandbox server unit tests should always
 * be run in a separate process from other types of tests.
 */
const mockFs = require("mock-fs");
const fs = require("fs");
const sinon = require("sinon");
const _eval = require("eval");

const util = require("../../../lib/util");

// ----------------------------------------------------------------------------
// Base helpers.
// ----------------------------------------------------------------------------
const base = module.exports = {
  // Generic test helpers.
  sandbox: null,
  mockFs: null,

  // File stuff
  // NOTE: Sync methods are OK here because mocked and in-memory.
  fileRead: (filePath, encoding) => fs.readFileSync(filePath).toString(encoding),
  fileExists: (filePath) => fs.existsSync(filePath)
};

// ----------------------------------------------------------------------------
// Global Setup / Teardown
// ----------------------------------------------------------------------------
beforeEach(() => {
  // From this point forward, all `fs` is **mocked**. This means that:
  // - File access through `fs` is mocked.
  // - Lazy `require()`'s may not work (depending on node version).
  base.mockFs = mockFs;
  base.mockFs();

  // Set up sandbox.
  base.sandbox = sinon.sandbox.create({
    useFakeTimers: true
  });

  // Node `4`+ can't `require` from the mocked filesystem, so hackily
  // approximate here.
  base.sandbox.stub(util, "_require").callsFake((mod) => {
    try {
      return require(mod); // eslint-disable-line global-require
    } catch (err) {
      if (err.code === "MODULE_NOT_FOUND" && base.fileExists(mod)) {
        return _eval(base.fileRead(mod), true);
      }

      throw err;
    }
  });
});

afterEach(() => {
  base.mockFs.restore();
  base.sandbox.restore();
});
