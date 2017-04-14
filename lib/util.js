"use strict";

const childProcess = require("child_process");

const IS_WIN = /^win/.test(process.platform);

// Cross-platform command wrapper.
//
// Portions from npm's lib/utils/lifecycle.js
const createCmd = (cmd, opts) => {
  // New object for mutation.
  opts = Object.assign({ env: {} }, opts);

  // Start with Mac/Linux assumption
  let shell = "sh";
  let shellFlags = "-c";

  // Mutate for windows.
  if (IS_WIN) {
    shell = opts.env.comspec || "cmd";
    shellFlags = "/d /s /c";
    opts.windowsVerbatimArguments = true;
  }

  // Simulate exec command using a shell for spawn.
  return {
    shell,
    cmd: [shellFlags, cmd],
    opts
  };
};

/**
 * Utilities.
 */
const util = module.exports = {
  // Stubbable method for requires.
  _require: require,

  // Permissive require that returns `null` if load error.
  requireOrNull: (mod) => {
    try {
      return util._require(mod);
    } catch (err) {
      return null;
    }
  },

  // Cross-platform exec-like wrapper around `child_process.spawn`.
  //
  // Currently does unbuffered output concurrently everywhere with addition
  // of "project" tag for easier readability.
  exec: (cmd, opts) => new Promise((resolve, reject) => {
    const args = createCmd(cmd, opts);
    opts = Object.assign({
      stdio: "inherit",
      env: process.env
    }, args.opts);

    const proc = childProcess.spawn(args.shell, args.cmd, opts);

    proc.on("close", (code) => {
      if (code === 0) {
        return void resolve();
      }

      const err = new Error(`Command: '${cmd}' failed with code: ${code}`);
      err.code = code;
      reject(err);
    });
  })
};
