"use strict";

const config = require("../../../../lib/config");
const base = require("../base.spec");
const util = require("../../util");
const toJs = util.toJs;
const toJson = util.toJson;

const minimalCfg = [];

describe("lib/config", () => {

  describe("#_normalizeConfig", () => {
    const norm = config._normalizeConfig;

    it("handles empty cases", () => {
      expect(norm()).to.eql([]);
      expect(norm(null)).to.eql([]);
      expect(norm([])).to.eql([]);
      expect(norm({})).to.eql([]);
    });

    it("converts strings to config object", () => {
      expect(norm(["one"])) .to.eql([
        { module: "one", tags: [] }
      ]);
      expect(norm(["one", "two"])) .to.eql([
        { module: "one", tags: [] },
        { module: "two", tags: [] }
      ]);
      expect(norm(["one", "two", "three"])) .to.eql([
        { module: "one", tags: [] },
        { module: "two", tags: [] },
        { module: "three", tags: [] }
      ]);
    });

    it("converts object shorthand to config object", () => {
      expect(norm({ one: {} })) .to.eql([
        { module: "one", tags: [] }
      ]);
      expect(norm({ one: {}, two: { tags: ["foo"] } })) .to.eql([
        { module: "one", tags: [] },
        { module: "two", tags: ["foo"] }
      ]);
      expect(norm({
        one: {},
        two: { tags: "foo" },
        three: { tags: ["foo", "bar"] }
      })).to.eql([
        { module: "one", tags: [] },
        { module: "two", tags: ["foo"] },
        { module: "three", tags: ["foo", "bar"] }
      ]);
    });

    it("converts array of objects to config object", () => {
      expect(norm([{ module: "one" }])) .to.eql([
        { module: "one", tags: [] }
      ]);
      expect(norm([{ module: "one" }, { module: "two", tags: ["foo"] }])) .to.eql([
        { module: "one", tags: [] },
        { module: "two", tags: ["foo"] }
      ]);
      expect(norm([
        { module: "one" },
        { module: "two", tags: ["foo"] },
        { module: "three", tags: ["foo", "bar"] }
      ])).to.eql([
        { module: "one", tags: [] },
        { module: "two", tags: ["foo"] },
        { module: "three", tags: ["foo", "bar"] }
      ]);
    });
  });

  describe("#getConfig", () => {

    it("errors on missing RC file", () => {
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
        ".lankrc.js": toJs(minimalCfg)
      });

      return config.getConfig();
    });

    it("resolves PWD/lankrc.json", () => {
      base.mockFs({
        ".lankrc.json": toJson(minimalCfg)
      });

      return config.getConfig();
    });

    it("resolves ../PWD/lankrc.js", () => {
      base.mockFs({
        "../.lankrc.js": toJs(minimalCfg)
      });

      return config.getConfig();
    });

    it("resolves ../PWD/lankrc.json", () => {
      base.mockFs({
        "../.lankrc.json": toJson(minimalCfg)
      });

      return config.getConfig();
    });

    it("chooses PWD/lankrc.js over ../PWD/lankrc.js", () => {
      base.mockFs({
        ".lankrc.js": toJs({ pwd: {} }),
        "../.lankrc.js": toJs({ belowPwd: {} }),
        "../pwd": {}
      });

      return config.getConfig()
        .then((cfg) => {
          expect(cfg).to.eql([{ module: "pwd", tags: [] }]);
        });
    });

    it("TODO: resolves ../../@SCOPE/PROJ/lankrc.js");
    it("TODO: chooses PWD/lankrc.js over ../../@SCOPE/PROJ/lankrc.js");

    it("errors on missing linked directories", () => {
      base.mockFs({
        ".lankrc.js": toJs(["one", "two"]),
        "../one": {}
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
        "../one": {},
        "../two": "not a directory"
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
