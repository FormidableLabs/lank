"use strict";

/**
 * Parse arguments for CLI.
 */
const Command = require("commander").Command;
const pkg = require("../package.json");
const actions = require("./actions");
const util = require("./util");

const EXAMPLES
= `  Examples:

    # Link (delete deps) for (1) all projects, (2) tagged projects
    $ lank link
    $ lank link --tags foo,bar

    # Execute shell command in (1) all projects, (2) tagged projects
    $ lank exec -- pwd
    $ lank exec --tags foo,bar -- pwd
`;

const toList = (items) => items.split(",").map((item) => item.trim()).filter(Boolean);

// Parse to arguments object.
const parseToArgs = (program, argv) => {
  argv = argv || process.argv;

  // Slice off extra args (`--`) to hand off to underlying process, etc.
  //
  // See: https://unix.stackexchange.com/questions/11376
  let extra = [];
  const extraIdx = argv.indexOf("--");
  if (extraIdx > -1) {
    // Update extra args.
    extra = argv.slice(extraIdx + 1);

    // Remove extra args from input.
    argv = argv.slice(0, extraIdx);
  }

  // Get args.
  program
    // Help, usage
    .usage("[action] [flags]")
    .version(pkg.version)
    .on("--help", () => {
      util._stdoutWrite(EXAMPLES);
    })

    // Flags
    .option("-t, --tags <tags>", "Comma-delimited tags to filter commands to", toList)
    .option("-m, --modules <modules>", "Comma-delimited modules to filter commands to", toList)
    .option("-d, --dry-run", "Display action to do without")
    .option("-s, --series", "Run actions sequentially, not in parallel")
    .option("-q, --quiet", "No additional lank output. Pass through existing stdout/stderr.")
    .option("-u, --unbuffered", "Don't buffer + save output, immediately display");

  // Add in actions as commands.
  Object.keys(actions).forEach((key) => {
    const action = actions[key];
    program
      .command(key)
      .description(action.description);
  });

  // Parse
  const parsed = program.parse(argv);

  return { parsed,
    extra };
};

// Get action
const getAction = (args) => {
  if (args.length > 1) {
    throw new Error(`Can only invoke one action. Found: '${args.join("', '")}'`);
  }

  // First arg as action or undefined.
  const actionName = args[0];
  if (!actionName) { return null; }

  // Get action.
  const action = actions[actionName];
  if (!action) {
    throw new Error(`Unrecognized action: '${actionName}'`);
  }

  return action;
};

// Internal tracking.
let _programs = [];

/**
 * Parse CLI arguments into script options.
 *
 * @param {Array}     argv  CLI arguments array
 * @returns {Object}        Options for invoking script
 */
module.exports.parse = (argv) => {
  // Create new instances for each parse (better for testing).
  const program = new Command();
  _programs.push(program); // track

  const args = parseToArgs(program, argv);
  const action = getAction(args.parsed.args);

  // No action invokes help. (In real operation this exits the process).
  if (!action) { return program.help(); }

  return {
    action,
    tags: args.parsed.tags || [],
    mods: args.parsed.modules || [],
    dryRun: !!args.parsed.dryRun,
    series: !!args.parsed.series,
    quiet: !!args.parsed.quiet,
    unbuffered: !!args.parsed.unbuffered,
    extra: args.extra
  };
};

// Shut down listeners, etc.
module.exports.close = () => {
  _programs.map((program) => program.removeAllListeners());
  _programs = [];
};
