"use strict";

/**
 * These are _almost_ functional tests as we're basically invoking the entire
 * application, just:
 *
 * - Mocking filesystem
 */
const program = require("commander");

const lank = require("../../../../bin/lank");
const toJs = require("../../util").toJs;
const appUtil = require("../../../../lib/util");

const base = require("../base.spec");

// Helper argv arrays.
const argv = (extra) => ["node", "lank.js"].concat(extra || []);

describe("bin/lank", () => {

  beforeEach(() => {
    base.sandbox.stub(program, "help");
  });

  describe(".lankrc", () => {

    it("errors on missing RC file", () => {
      return lank(argv(["exec", "--", "pwd"]))
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("configuration data");
        });
    });

    it("errors on missing linked directories", () => {
      base.mockFs({
        ".lankrc.js": toJs(["one", "two"]),
        "../one": {}
      });

      return lank(argv(["exec", "--", "pwd"]))
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("not found");
        });
    });

    it("TODO: errors if controlling project isn't linked");

    it("succeeds with valid config and directories", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          one: { tags: ["awesome", "hot"] },
          two: { tags: ["awesome"] }
        }),
        "../one": {},
        "../two": {}
      });

      return lank(argv());
    });
  });

  describe("help", () => {
    it("TODO: shows help on --help flag");
    it("TODO: shows help on no actions");
    it("TODO: shows help on no actions with extra arguments");
  });

  describe("actions", () => {
    it("TODO: errors on missing action");
    it("TODO: errors on multiple actions");
    it("TODO: errors if tags filter to no actions");
    it("TODO: runs on all projects if no tags");
    it("TODO: filters actions based on tags");
  });

  describe("exec", () => {
    it("TODO: errors if no shell command is given");
    it("TODO: execs a process");
    it("TODO: does not spawn a process on dry-run");
    it("TODO: limits to tags");
    it("TODO: limits to modules");
  });

  describe("link", () => {
    it("finds node_modules/two", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          one: { tags: ["awesome", "hot"] },
          two: { tags: ["awesome"] }
        }),
        "../one": {
          "node_modules": {
            "two": {
              "package.json": "{}"
            },
            "other": {
              "package.json": "{}"
            }
          }
        },
        "../two": {}
      });

      return lank(argv("link"))
        .then(() => {
          expect(appUtil._stdoutWrite).to.be.calledWithMatch("Found 1 directories");
          expect(base.fileExists("../one/node_modules/two")).to.be.false;
          expect(base.fileExists("../one/node_modules/other")).to.be.true;
        });
    });

    // TODO: HERE
    it("removes scoped packages", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          "@scope/one": { tags: ["awesome", "hot"] },
          "@scope/two": { tags: ["awesome"] }
        }),
        "../one": {
          "node_modules": {
            "@scope": {
              "two": {
                "package.json": "{}"
              },
              "other": {
                "package.json": "{}"
              }
            },
            "out-of-scope": {
              "package.json": "{}"
            }
          }
        },
        "../two": {}
      });

      return lank(argv("link"))
        .then(() => {
          expect(appUtil._stdoutWrite).to.be.calledWithMatch("Found 1 directories");
          expect(base.fileExists("../one/node_modules/@scope/two")).to.be.false;
          expect(base.fileExists("../one/node_modules/@scope/other")).to.be.true;
          expect(base.fileExists("../one/node_modules/out-of-scope")).to.be.true;
        });
    });

    it("TODO: removes symlinks");
    it("TODO: finds node_modules/nested/node_modules/foo");
    it("TODO: finds node_modules/nested1/node_modules/nested2/node_modules/foo");
    it("TODO: does not delete files on dry-run");
    it("TODO: limits to tags");
    it("TODO: limits to modules");
  });

});
