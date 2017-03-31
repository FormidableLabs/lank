"use strict";

const config = require("../../../../lib/config");
const base = require("../base.spec");

const minimalCfg = [];
const toJson = (code) => JSON.stringify(code);
const toJs = (code) => `module.exports = ${JSON.stringify(code)};`;

describe("lib/config", () => {

  describe("#_normalizeConfig", () => {
    const norm = config._normalizeConfig;

    it("handles empty cases", () => {
      expect(norm()).to.eql([]);
      expect(norm(null)).to.eql([]);
      expect(norm([])).to.eql([]);
      expect(norm({})).to.eql([]);
    });
  });

  describe("#getConfig", () => {

    it("errors on missing RC file", () => {
      return config.getConfig()
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

    it("TODO: chooses PWD/lankrc.js over ../PWD/lankrc.js");

    it("errors on non-Array lankrc", () => {
      base.mockFs({
        ".lankrc.js": toJs({})
      });

      return config.getConfig()
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("must be an array");
        });
    });

  });

});
