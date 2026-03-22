import { core, recommended } from "./packages/eslint-config/index.mjs"

export default [{ ignores: ["packages/**"] }, ...core, ...recommended]
