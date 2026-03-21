// Reexport the native module. On web, it will be resolved to SheptNativeModule.web.ts
// and on native platforms to SheptNativeModule.ts
export { default } from './src/SheptNativeModule';
export { default as SheptNativeView } from './src/SheptNativeView';
export * from  './src/SheptNative.types';
