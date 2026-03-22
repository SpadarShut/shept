import { core, recommended, react } from "@shept/eslint-config";

export default [
  ...core,
  ...recommended,
  ...react,
  {
    ignores: [
      "android/**",
      "ios/**",
      ".expo/**",
      "node_modules/**",
      "modules/shept-native/android/**",
      "modules/shept-native/ios/**",
    ],
  },
];
