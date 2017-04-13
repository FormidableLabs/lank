"use strict";

/**
 * These are _almost_ functional tests as we're basically invoking the entire
 * application, just:
 *
 * - Mocking filesystem
 */
const lank = require("../../../../bin/lank");
const util = require("../../util");
const toJs = util.toJs;

const base = require("../base.spec");

describe("bin/lank", () => {

  describe(".lankrc", () => {

    it("errors on missing RC file", () => {
      return lank()
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

      return lank()
        .then(() => {
          expect("should throw").to.be.false;
        })
        .catch((err) => {
          expect(err).to.have.property("message").that.contains("not found");
        });
    });

    it("succeeds with valid config and directories", () => {
      base.mockFs({
        ".lankrc.js": toJs({
          one: { tags: ["awesome", "hot"] },
          two: { tags: ["awesome"] }
        }),
        "../one": {},
        "../two": {}
      });

      return lank(["node", "lank.js"]);
    });

  });

});
