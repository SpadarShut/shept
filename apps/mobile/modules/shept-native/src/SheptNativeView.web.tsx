import * as React from 'react';

import { SheptNativeViewProps } from './SheptNative.types';

export default function SheptNativeView(props: SheptNativeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
