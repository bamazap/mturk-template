module.exports = {
  "env": {
    "browser": true
  },
  "plugins": ["compat"],
  "extends": [
    "airbnb-base",
    "plugin:compat/recommended"
  ],
  "rules": {
    "object-curly-newline": ["error", { "consistent": true }]
  }
};
