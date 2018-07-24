"use strict";

/**
 * Base server unit test initialization / global before/after's.
 *
 * This file should be `require`'ed by all other test files.
 *
 * **Note**: Because there is a global sandbox server unit tests should always
 * be run in a separate process from other types of tests.
 */
const path = require("path");
const mockFs = require("mock-fs");
const fs = require("fs-extra");
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
  fileJson: (filePath) => fs.readJsonSync(filePath),
  fileExists: (filePath) => fs.existsSync(filePath)
};

const REQUIRE_EXTS = {
  ".js": (mod) => _eval(base.fileRead(mod), true),
  ".json": (mod) => JSON.parse(base.fileRead(mod))
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
  base.sandbox = sinon.createSandbox({
    useFakeTimers: true
  });

  // Stub stdout, stderr.
  base.sandbox.stub(util, "_stdoutWrite");
  base.sandbox.stub(util, "_stderrWrite");

  // Assume we're in directory `one` unless otherwise specified.
  base.sandbox.stub(util, "_cwd").returns(path.resolve("one"));

  // Node `4`+ can't `require` from the mocked filesystem, so hackily
  // approximate here.
  base.sandbox.stub(util, "_require").callsFake((mod) => {
    try {
      return require(mod); // eslint-disable-line global-require
    } catch (err) {
      if (err.code === "MODULE_NOT_FOUND") {
        // First, try without any extension addition.
        const modExt = path.extname(mod);
        const rawRequire = REQUIRE_EXTS[modExt === "" ? ".js" : modExt];
        if (rawRequire && base.fileExists(mod)) {
          return rawRequire(mod);
        }

        // Next, try extensions.
        const code = Object.keys(REQUIRE_EXTS).reduce((memo, ext) =>
          // Search until we find a non-error resolution.
          memo || base.fileExists(`${mod}${ext}`) && REQUIRE_EXTS[ext](`${mod}${ext}`)
          , null);

        if (code) {
          return code;
        }
      }

      throw err;
    }
  });
});

afterEach(() => {
  base.mockFs.restore();
  base.sandbox.restore();
});
