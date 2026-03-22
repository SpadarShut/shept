const nativeClone =
  typeof structuredClone === "function" ? structuredClone : undefined
if (nativeClone)
  Object.defineProperty(globalThis, "structuredClone", {
    value: nativeClone,
    configurable: true,
    writable: true,
    enumerable: true,
  })

Object.defineProperty(globalThis, "__ExpoImportMetaRegistry", {
  value: {},
  configurable: true,
  writable: true,
  enumerable: true,
})
