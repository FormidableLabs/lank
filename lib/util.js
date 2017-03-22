"use strict";

/**
 * Utilities.
 */
const util = module.exports = {
  // Stubbable method for requires.
  _require: require,

  // Permissive require that returns `null` if load error.
  requireOrNull: (mod) => {
    try {
      return util._require(mod);
    } catch (err) {
      return null;
    }
  }
};
