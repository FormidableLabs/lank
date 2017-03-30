"use strict";

const config = require("../../../../lib/config");
const base = require("../base.spec");

const minimalCfg = [];
const toJson = (code) => JSON.stringify(code);
const toJs = (code) => `module.exports = ${JSON.stringify(code)};`;

describe("lib/config", () => {

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

      return config.getConfig()
        .catch((err) => {
          expect(err).to.not.be.ok;
        });
    });

    it("resolves PWD/lankrc.json", () => {
      base.mockFs({
        ".lankrc.json": toJson(minimalCfg)
      });

      return config.getConfig()
        .catch((err) => {
          expect(err).to.not.be.ok;
        });
    });

    it("resolves ../PWD/lankrc.js", () => {
      base.mockFs({
        "../.lankrc.js": toJs(minimalCfg)
      });

      return config.getConfig()
        .catch((err) => {
          expect(err).to.not.be.ok;
        });
    });

    it("resolves ../PWD/lankrc.json", () => {
      base.mockFs({
        "../.lankrc.json": toJson(minimalCfg)
      });

      return config.getConfig()
        .catch((err) => {
          expect(err).to.not.be.ok;
        });
    });

  });

});
