import { useEffect, useRef } from "react"
import { Animated } from "react-native"

import { PULSE_DURATION_MS, PULSE_OPACITY_MIN } from "../constants/home-screen"

export function usePulseAnimation(serviceStatus: string): Animated.Value {
  const pulseAnimation = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (serviceStatus === "recording") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: PULSE_OPACITY_MIN,
            duration: PULSE_DURATION_MS,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: PULSE_DURATION_MS,
            useNativeDriver: true,
          }),
        ]),
      )
      loop.start()
      return () => loop.stop()
    }
    pulseAnimation.setValue(1)
    return () => {}
  }, [serviceStatus, pulseAnimation])

  return pulseAnimation
}
