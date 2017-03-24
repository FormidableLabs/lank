"use strict";

/**
 * These are _almost_ functional tests as we're basically invoking the entire
 * application, just:
 *
 * - Mocking filesystem
 */
const lank = require("../../../../bin/lank");
//const base = require("../base.spec");

describe("bin/lank", () => {

  describe(".lankrc", () => {

    it("errors on missing RC file", () => {
      return lank()
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("configuration data");
        });
    });

    it("TODO - MORE TESTS HERE");

  });

});
