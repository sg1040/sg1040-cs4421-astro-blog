import eslintPluginAstro from "eslint-plugin-astro";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // Add custom rules here
      // "astro/no-set-html-directive": "error"
      "astro/no-exports-from-components": "off",
    },
  },
];