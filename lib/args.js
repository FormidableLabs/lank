"use strict";

/**
 * Parse arguments for CLI.
 */
const program = require("commander");
const pkg = require("../package.json");

const EXAMPLES =
`  Examples:

    # TODO: EXAMPLES
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
  const parsed = program
    // Help, usage
    .usage("[action] [flags]")
    .version(pkg.version)
    .description(pkg.description)
    .on("--help", () => {
      process.stdout.write(EXAMPLES);
    })

    // Flags
    // TODO: IMPLEMENT STUFF
    //.option("-c, --config <path>", "Path to config (default `${PWD}/.lankrc.js`)")
    .option("-t, --tags <tags>", "Comma-delimited tags to filter commands to",
      (tags) => tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    )

    // Parse
    .parse(argv);

  return { parsed, extra };
};

// Get action
const getAction = (args) => {
  if (args.length > 1) {
    throw new Error(`Can only invoke one action. Found: '${args.join("', '")}'`);
  }

  // Return first arg as action or undefined.
  return args[0];
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
  if (!action) { program.help(); }

  return {
    action,
    tags: args.parsed.tags || [],
    extra: args.extra
  };
};
