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
const parseToArgs = (argv) => program
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

  // Parse
  .parse(argv || process.argv);

/**
 * Parse CLI arguments into script options.
 *
 * @param {Array}     argv  CLI arguments array
 * @returns {Object}        Options for invoking script
 */
module.exports.parse = (argv) => {
  const args = parseToArgs(argv);
  return { TODO_REMOVE: args };
};
