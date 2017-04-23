"use strict";

module.exports = {
  toJson: (code) => JSON.stringify(code),

  toJs: (code) => `module.exports = ${JSON.stringify(code)};`
};
