"use strict";

const config = require("../../../../lib/config");
//const base = require("../base.spec");

describe("lib/config", () => {

  describe("#getConfig", () => {

    it("errors on missing RC file", () => {
      return config.getConfig()
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("configuration data");
        });
    });

    it("TODO - MORE TESTS HERE");

  });

});
