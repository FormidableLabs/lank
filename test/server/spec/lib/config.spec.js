"use strict";

const path = require("path");

const config = require("../../../../lib/config");
const base = require("../base.spec");
const util = require("../../util");
const toJs = util.toJs;
const toJson = util.toJson;

const appUtil = require("../../../../lib/util");
const minimalCfg = ["one"];

describe("lib/config", () => {
  describe("#_normalizeProjects", () => {
    const norm = config._normalizeProjects;

    it("handles empty cases", () => {
      expect(norm()).to.eql([]);
      expect(norm(null)).to.eql([]);
      expect(norm([])).to.eql([]);
      expect(norm({})).to.eql([]);
    });

    it("converts strings to config object", () => {
      expect(norm(["one"])).to.eql([
        { module: "one",
          tags: [] }
      ]);
      expect(norm(["one", "two"])).to.eql([
        { module: "one",
          tags: [] },
        { module: "two",
          tags: [] }
      ]);
      expect(norm(["one", "two", "three"])).to.eql([
        { module: "one",
          tags: [] },
        { module: "two",
          tags: [] },
        { module: "three",
          tags: [] }
      ]);
    });

    it("converts object shorthand to config object", () => {
      expect(norm({ one: {} })).to.eql([
        { module: "one",
          tags: [] }
      ]);
      expect(norm({ one: {},
        two: { tags: ["foo"] } })).to.eql([
        { module: "one",
          tags: [] },
        { module: "two",
          tags: ["foo"] }
      ]);
      expect(norm({
        one: {},
        two: { tags: "foo" },
        three: { tags: ["foo", "bar"] }
      })).to.eql([
        { module: "one",
          tags: [] },
        { module: "two",
          tags: ["foo"] },
        { module: "three",
          tags: ["foo", "bar"] }
      ]);
    });

    it("converts array of objects to config object", () => {
      expect(norm([{ module: "one" }])).to.eql([
        { module: "one",
          tags: [] }
      ]);
      expect(norm([{ module: "one" }, { module: "two",
        tags: ["foo"] }])).to.eql([
        { module: "one",
          tags: [] },
        { module: "two",
          tags: ["foo"] }
      ]);
      expect(norm([
        { module: "one" },
        { module: "two",
          tags: ["foo"] },
        { module: "three",
          tags: ["foo", "bar"] }
      ])).to.eql([
        { module: "one",
          tags: [] },
        { module: "two",
          tags: ["foo"] },
        { module: "three",
          tags: ["foo", "bar"] }
      ]);
    });
  });

  describe("#getConfig", () => {
    it("errors on missing control package.json", () => {
      base.mockFs({
        one: {}
      });

      return config.getConfig()
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("read controlling project");
        });
    });

    it("errors on missing RC file", () => {
      base.mockFs({
        one: {
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig()
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("configuration data");
        });
    });

    it("resolves PWD/lankrc.js", () => {
      base.mockFs({
        one: {
          ".lankrc.js": toJs(minimalCfg),
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig();
    });

    it("resolves PWD/lankrc.json", () => {
      base.mockFs({
        one: {
          ".lankrc.json": toJson(minimalCfg),
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig();
    });

    it("resolves lankrc.js", () => {
      base.mockFs({
        ".lankrc.js": toJs(minimalCfg),
        one: {
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig();
    });

    it("resolves one/lankrc.json", () => {
      base.mockFs({
        ".lankrc.json": toJson(minimalCfg),
        one: {
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig();
    });

    it("chooses one/lankrc.js over lankrc.js", () => {
      base.mockFs({
        ".lankrc.js": toJs({ belowPwd: {} }),
        one: {
          ".lankrc.js": toJs(minimalCfg),
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig()
        .then((cfg) => {
          expect(cfg).to.eql({
            control: {
              module: "one",
              siblingPath: ".."
            },
            projs: [{
              module: "one",
              tags: []
            }]
          });
        });
    });

    it("resolves @org/red/lankrc.js", () => {
      appUtil._cwd.returns(path.resolve("@org/red"));

      base.mockFs({
        "@org": {
          red: {
            ".lankrc.json": toJson(["@org/red"]),
            "package.json": JSON.stringify({ name: "@org/red" })
          }
        }
      });

      return config.getConfig()
        .then((cfg) => {
          expect(cfg).to.eql({
            control: {
              module: "@org/red",
              siblingPath: "../.."
            },
            projs: [{
              module: "@org/red",
              tags: []
            }]
          });
        });
    });

    it("resolves lankrc.js for scoped module", () => {
      appUtil._cwd.returns(path.resolve("@org/red"));

      base.mockFs({
        ".lankrc.json": toJson(["@org/red"]),
        "@org": {
          red: {
            "package.json": JSON.stringify({ name: "@org/red" })
          }
        }
      });

      return config.getConfig()
        .then((cfg) => {
          expect(cfg).to.eql({
            control: {
              module: "@org/red",
              siblingPath: "../.."
            },
            projs: [{
              module: "@org/red",
              tags: []
            }]
          });
        });
    });

    it("chooses @org/red/lankrc.js over lankrc.js", () => {
      appUtil._cwd.returns(path.resolve("@org/red"));

      base.mockFs({
        ".lankrc.js": toJs({ belowPwd: {} }),
        "@org": {
          red: {
            ".lankrc.json": toJson(["@org/red"]),
            "package.json": JSON.stringify({ name: "@org/red" })
          }
        }
      });

      return config.getConfig()
        .then((cfg) => {
          expect(cfg).to.eql({
            control: {
              module: "@org/red",
              siblingPath: "../.."
            },
            projs: [{
              module: "@org/red",
              tags: []
            }]
          });
        });
    });

    it("errors on missing linked directories", () => {
      base.mockFs({
        one: {
          ".lankrc.js": toJs(["one", "two"]),
          "package.json": JSON.stringify({ name: "one" })
        }
      });

      return config.getConfig()
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("not found");
        });
    });

    it("errors on non-directory linked file", () => {
      base.mockFs({
        ".lankrc.js": toJs(["one", "two"]),
        one: {
          "package.json": JSON.stringify({ name: "one" })
        },
        two: "not a directory"
      });

      return config.getConfig()
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("not a directory");
        });
    });
  });
});
