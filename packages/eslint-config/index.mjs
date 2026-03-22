import noComments from "eslint-plugin-no-comments";
import betterMaxParams from "eslint-plugin-better-max-params";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import security from "eslint-plugin-security";

export const core = [
  {
    plugins: {
      "no-comments": noComments,
      "better-max-params": betterMaxParams,
    },
    rules: {
      "no-comments/disallowComments": "error",
      "better-max-params/better-max-params": [
        "error",
        { constructor: 10, func: 2 },
      ],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true },
      ],
      "max-lines": ["error", { max: 250, skipBlankLines: true }],
      "no-magic-numbers": [
        "error",
        {
          detectObjects: false,
          enforceConst: true,
          ignore: [0, 1, -1, 2],
          ignoreArrayIndexes: true,
        },
      ],
      complexity: ["error", 10],
      "max-depth": ["error", 4],
      "max-statements": ["error", 20],
      "max-classes-per-file": ["error", 1],
      "no-console": "error",
      "id-length": ["error", { min: 2 }],
      eqeqeq: ["error", "always"],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Direct process.env access forbidden. Use DI to get configuration",
        },
      ],
    },
  },
];

export const recommended = [
  sonarjs.configs.recommended,
  unicorn.configs["recommended"],
  security.configs.recommended,
];

export const react = [];
