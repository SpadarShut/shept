import { requireNativeView } from 'expo';
import * as React from 'react';

import { SheptNativeViewProps } from './SheptNative.types';

const NativeView: React.ComponentType<SheptNativeViewProps> =
  requireNativeView('SheptNative');

export default function SheptNativeView(props: SheptNativeViewProps) {
  return <NativeView {...props} />;
}
