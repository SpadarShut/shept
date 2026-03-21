import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './SheptNative.types';

type SheptNativeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class SheptNativeModule extends NativeModule<SheptNativeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(SheptNativeModule, 'SheptNativeModule');
