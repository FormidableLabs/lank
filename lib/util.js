"use strict";

const childProcess = require("child_process");
const chalk = require("chalk");

const IS_WIN = /^win/.test(process.platform);
const MAX_PAD = 32;
const PAD = " ".repeat(MAX_PAD);

// Cross-platform command wrapper.
//
// Portions from npm's lib/utils/lifecycle.js
const createCmd = (cmd, shellOpts) => {
  // New object for mutation.
  shellOpts = Object.assign({ env: {} }, shellOpts);

  // Start with Mac/Linux assumption
  let shell = "sh";
  let shellFlags = "-c";

  // Mutate for windows.
  if (IS_WIN) {
    shell = shellOpts.env.comspec || "cmd";
    shellFlags = "/d /s /c";
    shellOpts.windowsVerbatimArguments = true;
  }

  // Simulate exec command using a shell for spawn.
  return {
    shell,
    cmd: [shellFlags, cmd],
    shellOpts
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

  // Color formatted messages, yo!
  fmt: (obj) => {
    const tag = chalk[obj.color || "white"]([
      "[",
      obj.proj || "lank",
      obj.key ? ":" : "",
      obj.key || "",
      "]"
    ].join(""));

    return [
      tag,
      PAD.slice(-PAD.length + tag.length), // http://stackoverflow.com/questions/2686855
      " ",
      obj.msg
    ].join("");
  },

  // Cross-platform exec-like wrapper around `child_process.spawn`.
  //
  // Currently does unbuffered output concurrently everywhere with addition
  // of "project" tag for easier readability.
  exec: (cmd, shellOpts) => new Promise((resolve, reject) => {
    const args = createCmd(cmd, shellOpts);
    shellOpts = Object.assign({
      stdio: "pipe",
      env: process.env
    }, args.shellOpts);

    process.stdout.write(util.fmt({
      color: "gray", proj: "TODO_PROJ", key: "exec", msg: `${chalk.gray(cmd)}\n`
    }));
    const proc = childProcess.spawn(args.shell, args.cmd, shellOpts);

    proc.stdout.on("data", (data) => {
      process.stdout.write(util.fmt({
        color: "green", proj: "TODO_PROJ", key: "stdout", msg: data
      }));
    });
    proc.stderr.on("data", (data) => {
      process.stderr.write(util.fmt({
        color: "red", proj: "TODO_PROJ", key: "stderr", msg: data
      }));
    });
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
