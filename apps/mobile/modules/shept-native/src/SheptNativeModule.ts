import { NativeModule, requireNativeModule } from 'expo';

import { SheptNativeModuleEvents } from './SheptNative.types';

declare class SheptNativeModule extends NativeModule<SheptNativeModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<SheptNativeModule>('SheptNative');
