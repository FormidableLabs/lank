"use strict";

const childProcess = require("child_process");
const os = require("os");
const path = require("path");
const chalk = require("chalk");

const IS_WIN = /^win/.test(process.platform);
const MAX_KEY = 12;

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
  // Stubbable method for requires and other utils.
  _require: require,
  _stdoutWrite: process.stdout.write.bind(process.stdout),
  _stderrWrite: process.stderr.write.bind(process.stderr),
  _cwd: () => process.cwd(),

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
      const longestProj = (cfg || []).reduce((acc, obj) => {
        return acc >= obj.module.length ? acc : obj.module.length;
      }, 0);

      util._fmt = (obj) => {
        const proj = obj.proj || "lank";
        const tag = `[${proj}${obj.key ? `:${obj.key}` : ""}]`;
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
  // eslint-disable-next-line promise/avoid-new,max-statements
  exec: (cmd, shellOpts, opts) => new Promise((resolve, reject) => {
    // Validate.
    if (!(opts && opts.cfg)) {
      return void reject(new Error("Must pass opts with cfg")); // Programming error
    }

    // Infer and mutate shell options.
    const isDryRun = opts.dryRun;
    const args = createCmd(cmd, shellOpts);
    shellOpts = Object.assign({
      stdio: "pipe",
      env: Object.assign({}, process.env)
    }, args.shellOpts);

    // Enhance NODE_PATH
    shellOpts.env.NODE_PATH = (shellOpts.env.NODE_PATH || "")
      .split(path.delimiter)
      .concat([path.join(util._cwd(), util.getSiblingPath(opts.cfg))]) // Add in projects directory.
      .filter(Boolean)
      .join(path.delimiter);

    // Get formatter, wrappers.
    const fmt = util.getFmt(opts.cfg);
    const writeMsg = (msg) => {
      const write = msg.key === "stderr" ? util._stderrWrite : util._stdoutWrite;
      write(`${fmt(msg)}${os.EOL}`);
    };

    // Start up the process.
    const proc = isDryRun ?
      { pid: "dry-run" } :
      childProcess.spawn(args.shell, args.cmd, shellOpts);

    // Write process info at start and end.
    const execMsg = (extra) => ({
      color: "gray", proj: opts.proj, key: `exec:${extra}`,
      msg: `${chalk.gray(cmd)} (pid: ${proc.pid})`
    });
    writeMsg(execMsg("start"));

    // Short-circuit dry run
    if (isDryRun) { return void resolve(); }

    // If real process, set all handlers.
    const buffer = [execMsg("finish")];
    proc.stdout.on("data", (data) => {
      buffer.push({
        color: "green", proj: opts.proj, key: "stdout", msg: data.toString()
      });
    });
    proc.stderr.on("data", (data) => {
      buffer.push({
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
  }),

  /**
   * Get sibling path for other modules from configuration.
   *
   * @param {Object}    cfg Processed configuration object
   * @returns {String}      Relative path from control to other projects
   */
  getSiblingPath: (cfg) => {
    const control = cfg.find((obj) => (obj._lank || {}).control);
    if (!control) {
      throw new Error("Configuration incomplete. No control module found");
    }

    return control._lank.siblingPath;
  }
};
