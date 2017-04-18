"use strict";

/**
 * Parse arguments for CLI.
 */
const program = require("commander");
const pkg = require("../package.json");
const actions = require("./actions");

const EXAMPLES =
`  Examples:

    # Link (delete deps) for (1) all projects, (2) tagged projects
    $ lank link
    $ lank link --tags foo,bar

    # Execute shell command in (1) all projects, (2) tagged projects
    $ lank exec -- pwd
    $ lank exec --tags foo,bar -- pwd
`;

// Parse to arguments object.
const parseToArgs = (argv) => {
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
      process.stdout.write(EXAMPLES);
    })

    // Flags
    .option("-t, --tags <tags>", "Comma-delimited tags to filter commands to",
      (tags) => tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    )
    .option("-d, --dry-run", "Display action to do without");

    // TODO: IMPLEMENT `-d, --dry-run`.

  // Add in actions as commands.
  Object.keys(actions).forEach((key) => {
    const action = actions[key];
    program
      .command(key)
      .description(action.description);
  });

  // Parse
  const parsed = program.parse(argv);

  return { parsed, extra };
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

/**
 * Parse CLI arguments into script options.
 *
 * @param {Array}     argv  CLI arguments array
 * @returns {Object}        Options for invoking script
 */
module.exports.parse = (argv) => {
  const args = parseToArgs(argv);
  const action = getAction(args.parsed.args);

  // No action invokes help. (In real operation this exits the process).
  if (!action) { return program.help(); }

  return {
    action,
    tags: args.parsed.tags || [],
    dryRun: !!args.parsed.dryRun,
    extra: args.extra
  };
};
