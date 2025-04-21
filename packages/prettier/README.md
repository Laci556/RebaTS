# @rebats/prettier

> Common configuration for Prettier

## Usage

To use it in an application/package, add the library to the `devDependencies` in
the `package.json` file:

```json
{
  "devDependencies": {
    "@rebats/prettier": "workspace:*"
  }
}
```

Then, create a `.prettierrc.js` file in the root of the project with the
following content:

```js
const config = require("@rebats/prettier/config");

module.exports = config();
```

Optionally, you can override the default rules and add plugins.
`prettier-plugin-organize-imports` is included by default,
`prettier-plugin-tailwindcss` is also available without installing it
separately.

```js
module.exports = config({
  rules: { semi: false },
  plugins: ["prettier-plugin-tailwindcss"],
});
```
