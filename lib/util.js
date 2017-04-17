"use strict";

const childProcess = require("child_process");
const os = require("os");
const chalk = require("chalk");

const IS_WIN = /^win/.test(process.platform);
const MAX_KEY = 8;

// Cross-platform command wrapper.
//
// Portions from npm's lib/utils/lifecycle.js
const createCmd = (cmd, shellOpts) => {
  // New object for mutation.
  shellOpts = Object.assign({}, shellOpts);

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

  // Lazy bind formatter to configuration.
  _fmt: null,

  // Color formatted messages, yo!
  getFmt: (cfg) => {
    if (!util._fmt) {
      // Get longest project name length (for padding).
      const longestProj = cfg.reduce((acc, obj) => {
        return acc >= obj.module.length ? acc : obj.module.length;
      }, 0);

      util._fmt = (obj) => {
        const proj = obj.proj || "lank";
        const tag = [
          "[",
          proj,
          obj.key ? ":" : "",
          obj.key || "",
          "]"
        ].join("");

        const pad = " ".repeat(
          tag.length + (longestProj - proj.length) + (MAX_KEY - obj.key.length)
        );

        return obj.msg.split(os.EOL).map((msg) => [
          chalk[obj.color || "white"](tag),
          pad.slice(-pad.length + tag.length), // http://stackoverflow.com/questions/2686855
          msg
        ].join("")).join(os.EOL);
      };
    }

    return util._fmt;
  },

  // Cross-platform exec-like wrapper around `child_process.spawn`.
  //
  // Currently does unbuffered output concurrently everywhere with addition
  // of "project" tag for easier readability.
  //
  // eslint-disable-next-line promise/avoid-new
  exec: (cmd, shellOpts, opts) => new Promise((resolve, reject) => {
    const args = createCmd(cmd, shellOpts);
    opts = opts || {};
    shellOpts = Object.assign({
      stdio: "pipe",
      env: Object.assign({}, process.env)
    }, args.shellOpts);

    // Get formatter, wrappers.
    const fmt = util.getFmt(opts.cfg);
    const writeMsg = (msg) => {
      const out = msg.key === "stderr" ? "stderr" : "stdout";
      process[out].write(`${fmt(msg)}\n`);
    };

    // Start up the process.
    const proc = childProcess.spawn(args.shell, args.cmd, shellOpts);

    // Buffer data.
    let buffer = [{
      color: "gray", proj: opts.proj, key: "exec", msg: `${chalk.gray(cmd)} (pid: ${proc.pid})`
    }];

    // Write process info at start and end.
    writeMsg(buffer[0]);

    proc.stdout.on("data", (data) => {
      buffer = buffer.concat({
        color: "green", proj: opts.proj, key: "stdout", msg: data.toString()
      });
    });
    proc.stderr.on("data", (data) => {
      buffer = buffer.concat({
        color: "red", proj: opts.proj, key: "stderr", msg: data.toString()
      });
    });

    proc.on("close", (code) => {
      // Drain buffers to formatted output.
      buffer.forEach(writeMsg);

      if (code === 0) {
        return void resolve();
      }

      const err = new Error(`Command: '${cmd}' failed with code: ${code}`);
      err.code = code;
      reject(err);
    });
  })
};
