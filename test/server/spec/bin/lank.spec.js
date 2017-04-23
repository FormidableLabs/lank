"use strict";

/**
 * These are _almost_ functional tests as we're basically invoking the entire
 * application, just:
 *
 * - Mocking filesystem
 */
const path = require("path");
const fs = require("fs-extra");
const childProcess = require("child_process");
const Command = require("commander").Command;

const lank = require("../../../../bin/lank");
const toJs = require("../../util").toJs;
const appUtil = require("../../../../lib/util");

const base = require("../base.spec");

// Helper argv arrays.
const argv = (extra) => ["node", "lank.js"].concat(extra || []);

describe("bin/lank", () => {

  beforeEach(() => {
    base.sandbox.stub(Command.prototype, "help");
  });

  describe(".lankrc", () => {

    it("errors on missing RC file", () => {
      base.mockFs({
        "one": {
          "package.json": JSON.stringify({ name: "one" })
        }
      });

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
        "one": {
          ".lankrc.js": toJs(["one", "two"]),
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return lank(argv(["exec", "--", "pwd"]))
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("not found");
        });
    });

    it("errors if controlling project isn't linked", () => {
      base.mockFs({
        "one": {
          ".lankrc.js": toJs(["two"]),
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return lank(argv(["exec", "--", "pwd"]))
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("Controlling project");
        });
    });

    it("succeeds with valid config and directories", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          one: { tags: ["awesome", "hot"] },
          two: { tags: ["awesome"] }
        }),
        "one": {
          "package.json": JSON.stringify({ name: "one" })
        },
        "two": {}
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
    let procStubs;

    beforeEach(() => {
      procStubs = {
        stdout: { on: base.sandbox.stub() },
        stderr: { on: base.sandbox.stub() },
        // Call as `proc.on("close", (code = 0) => {})`
        on: base.sandbox.stub().callsArgWith(1, 0)
      };

      base.sandbox.stub(childProcess, "spawn").callsFake(() => procStubs);
    });

    it("updates NODE_PATH to .. when run in a normal module", () => {
      base.mockFs({
        "one": {
          ".lankrc.js": toJs(["one", "two"]),
          "package.json": JSON.stringify({ name: "one" })
        },
        "two": {
          "package.json": JSON.stringify({ name: "two" })
        }
      });

      return lank(argv(["exec", "--", "pwd"]))
        .then(() => {
          expect(childProcess.spawn).to.have.callCount(2);

          // one
          const oneOpts = childProcess.spawn.getCall(0).args[2];
          expect(oneOpts).to.have.property("cwd", path.resolve(appUtil._cwd()));
          expect(oneOpts)
            .to.have.property("env")
              .that.has.property("NODE_PATH");

          const oneNP = oneOpts.env.NODE_PATH.split(path.delimiter);
          expect(oneNP).to.include.members([path.resolve(appUtil._cwd(), "..")]);

          // two
          const twoOpts = childProcess.spawn.getCall(1).args[2];
          expect(twoOpts).to.have.property("cwd", path.resolve(appUtil._cwd(), "../two"));
          expect(twoOpts)
            .to.have.property("env")
              .that.has.property("NODE_PATH");

          const twoNP = twoOpts.env.NODE_PATH.split(path.delimiter);
          expect(twoNP).to.include.members([path.resolve(appUtil._cwd(), "..")]);
        });
    });

    it("updates NODE_PATH to ../.. when run in a scoped module", () => {
      appUtil._cwd.returns(path.resolve("@org/red"));

      base.mockFs({
        "@org": {
          "red": {
            ".lankrc.js": toJs(["@org/red", "@org/blue", "two"]),
            "package.json": JSON.stringify({ name: "@org/red" })
          },
          "blue": {
            "package.json": JSON.stringify({ name: "@org/blue" })
          }
        },
        "two": {
          "package.json": JSON.stringify({ name: "two" })
        }
      });

      return lank(argv(["exec", "--", "pwd"]))
        .then(() => {
          expect(childProcess.spawn).to.have.callCount(3);

          // @org/red
          const redOpts = childProcess.spawn.getCall(0).args[2];
          expect(redOpts).to.have.property("cwd", path.resolve(appUtil._cwd()));
          expect(redOpts)
            .to.have.property("env")
              .that.has.property("NODE_PATH");

          const redNP = redOpts.env.NODE_PATH.split(path.delimiter);
          expect(redNP).to.include.members([path.resolve(appUtil._cwd(), "../..")]);

          // @org/blue
          const blueOpts = childProcess.spawn.getCall(1).args[2];
          expect(blueOpts).to.have.property("cwd", path.resolve(appUtil._cwd(), "../../@org/blue"));
          expect(blueOpts)
            .to.have.property("env")
              .that.has.property("NODE_PATH");

          const blueNP = blueOpts.env.NODE_PATH.split(path.delimiter);
          expect(blueNP).to.include.members([path.resolve(appUtil._cwd(), "../..")]);

          // two
          const twoOpts = childProcess.spawn.getCall(2).args[2];
          expect(twoOpts).to.have.property("cwd", path.resolve(appUtil._cwd(), "../../two"));
          expect(twoOpts)
            .to.have.property("env")
              .that.has.property("NODE_PATH");

          const twoNP = twoOpts.env.NODE_PATH.split(path.delimiter);
          expect(twoNP).to.include.members([path.resolve(appUtil._cwd(), "../..")]);
        });
    });

    it("allows running actions on projects not including control project", () => {
      base.mockFs({
        "one": {
          ".lankrc.js": toJs(["one", "two"]),
          "package.json": JSON.stringify({ name: "one" })
        },
        "two": {
          "package.json": JSON.stringify({ name: "two" })
        }
      });

      return lank(argv(["exec", "-m", "two", "--", "pwd"]))
        .then(() => {
          expect(childProcess.spawn).to.have.callCount(1);

          // two
          const twoOpts = childProcess.spawn.getCall(0).args[2];
          expect(twoOpts).to.have.property("cwd", path.resolve(appUtil._cwd(), "../two"));
        });
    });

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
        "one": {
          "package.json": JSON.stringify({ name: "one" }),
          "node_modules": {
            "two": {
              "package.json": "{}"
            },
            "other": {
              "package.json": "{}"
            }
          }
        },
        "two": {}
      });

      return lank(argv("link"))
        .then(() => {
          expect(appUtil._stdoutWrite).to.be.calledWithMatch("Found 1 directories");
          expect(base.fileExists("one/node_modules/two")).to.be.false;
          expect(base.fileExists("one/node_modules/other")).to.be.true;
        });
    });

    it("removes scoped packages", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          "one": { tags: ["awesome", "hot"] },
          "@scope/two": { tags: ["awesome"] },
          "three": {}
        }),
        "one": {
          "package.json": JSON.stringify({ name: "one" }),
          "node_modules": {
            "@scope": {
              "two": {
                "package.json": "{}"
              },
              "other": {
                "package.json": "{}",
                "node_modules": {
                  "three": {
                    "package.json": "{}"
                  }
                }
              }
            },
            "out-of-scope": {
              "package.json": "{}"
            }
          }
        },
        "@scope/two": {},
        "three": {}
      });

      return lank(argv("link"))
        .then(() => {
          expect(appUtil._stdoutWrite).to.be.calledWithMatch("Found 2 directories");
          expect(base.fileExists("one/node_modules/@scope/two")).to.be.false;
          expect(base.fileExists("one/node_modules/@scope/other")).to.be.true;
          expect(base.fileExists("one/node_modules/@scope/other/node_modules/three"))
            .to.be.false;
          expect(base.fileExists("one/node_modules/out-of-scope")).to.be.true;
        });
    });

    it("removes scoped packages when run from a scoped project", () => {
      appUtil._cwd.returns(path.resolve("@scope/two"));

      base.mockFs({
        ".lankrc.js": toJs({
          "one": { tags: ["awesome", "hot"] },
          "@scope/two": { tags: ["awesome"] },
          "three": {}
        }),
        "one": {
          "node_modules": {
            "@scope": {
              "two": {
                "package.json": "{}"
              },
              "other": {
                "package.json": "{}",
                "node_modules": {
                  "three": {
                    "package.json": "{}"
                  }
                }
              }
            },
            "out-of-scope": {
              "package.json": "{}"
            }
          }
        },
        "@scope": {
          "two": {
            "package.json": JSON.stringify({ name: "@scope/two" })
          }
        },
        "three": {}
      });

      return lank(argv("link"))
        .then(() => {
          expect(appUtil._stdoutWrite).to.be.calledWithMatch("Found 2 directories");
          expect(base.fileExists("one/node_modules/@scope/two")).to.be.false;
          expect(base.fileExists("one/node_modules/@scope/other")).to.be.true;
          expect(base.fileExists("one/node_modules/@scope/other/node_modules/three"))
            .to.be.false;
          expect(base.fileExists("one/node_modules/out-of-scope")).to.be.true;
        });
    });

    it("removes symlinks", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          one: { tags: ["awesome", "hot"] },
          two: { tags: ["awesome"] }
        }),
        "one": {
          "package.json": JSON.stringify({ name: "one" }),
          "node_modules": {}
        },
        "two": {}
      });

      fs.symlinkSync("two", "one/node_modules/two");
      expect(fs.lstatSync("one/node_modules/two").isSymbolicLink()).to.be.true;

      return lank(argv("link"))
        .then(() => {
          expect(appUtil._stdoutWrite).to.be.calledWithMatch("Found 1 directories");
          expect(() => fs.lstatSync("one/node_modules/two").isSymbolicLink()).to.throw("ENOENT");
          expect(base.fileExists("one/node_modules/two")).to.be.false;
        });
    });

    it("TODO: finds node_modules/nested/node_modules/foo");
    it("TODO: finds node_modules/nested1/node_modules/nested2/node_modules/foo");
    it("TODO: does not delete files on dry-run");
    it("TODO: limits to tags");
    it("TODO: limits to modules");
  });

});
