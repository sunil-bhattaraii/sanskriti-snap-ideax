import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { COLORS } from '@/constants/colors';

const DURATION = 600;

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.6 }],
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const fadeKeyframe = new Keyframe({
  0: {
    opacity: 1,
  },
  70: {
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 0,
  },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const logo = (
    <Animated.View entering={logoKeyframe.duration(DURATION)} style={styles.logoWrapper}>
      <Image style={styles.logo} source={require('@/assets/images/icon.png')} />
    </Animated.View>
  );

  return animate ? (
    <Animated.View
      entering={fadeKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {logo}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {logo}
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});