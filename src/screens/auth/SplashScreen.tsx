import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoSplashScreen from 'expo-splash-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive scaling based on a 375pt baseline (standard iPhone width)
const scaleSize = (size: number) => (SCREEN_WIDTH / 375) * size;
const isSmallDevice = SCREEN_WIDTH < 360;
const isTablet = SCREEN_WIDTH >= 768;

const LOGO_SIZE = isTablet ? 140 : isSmallDevice ? 90 : 110;

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // This is the first thing to paint with the same background as the
    // native splash (see app.json), so hiding it here is a seamless handoff.
    ExpoSplashScreen.hideAsync().catch(() => {});

    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Glow pulse loop (behind logo)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loading dots wave animation
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]).start();

    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '0deg'],
  });

  return (
    <LinearGradient
      colors={['#052E22', '#0B7A5B', '#10A375']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      {/* Subtle top-right glow */}
      <View style={styles.glowCircleTop} />
      <View style={styles.glowCircleBottom} />

      <Animated.View
        style={{
          transform: [{ scale }, { rotate: rotateInterpolate }],
          opacity,
          alignItems: 'center',
        }}
      >
        {/* Pulsing outer glow ring */}
        <Animated.View
          style={[
            styles.outerGlow,
            {
              width: LOGO_SIZE + 40,
              height: LOGO_SIZE + 40,
              borderRadius: (LOGO_SIZE + 40) / 2,
              opacity: glowPulse,
            },
          ]}
        />

        {/* Logo badge */}
        <View
          style={[
            styles.logoRing,
            {
              width: LOGO_SIZE + 14,
              height: LOGO_SIZE + 14,
              borderRadius: (LOGO_SIZE + 14) / 2,
            },
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#D9F2E6']}
            style={[
              styles.logo,
              {
                width: LOGO_SIZE,
                height: LOGO_SIZE,
                borderRadius: LOGO_SIZE / 2,
              },
            ]}
          >
            <Text style={[styles.logoText, { fontSize: LOGO_SIZE * 0.36 }]}>
              SM
            </Text>
          </LinearGradient>
        </View>

        <Text style={styles.title}>Saif Marketing</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>Management System</Text>
      </Animated.View>

      <Animated.View style={[styles.loader, { opacity }]}>
        <Animated.View style={[styles.dot, { opacity: dot1, transform: [{ scale: dot1 }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot2, transform: [{ scale: dot2 }] }]} />
        <Animated.View style={[styles.dot, { opacity: dot3, transform: [{ scale: dot3 }] }]} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowCircleTop: {
    position: 'absolute',
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  glowCircleBottom: {
    position: 'absolute',
    bottom: -SCREEN_WIDTH * 0.35,
    left: -SCREEN_WIDTH * 0.35,
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: SCREEN_WIDTH * 0.45,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoRing: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C9A24B', // premium gold accent border
  },
  logoText: {
    fontWeight: '800',
    color: '#0B7A5B',
    letterSpacing: 1,
  },
  title: {
    fontSize: isTablet ? 34 : isSmallDevice ? 22 : 26,
    fontWeight: '700',
    color: '#fff',
    marginTop: 22,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  divider: {
    width: 36,
    height: 2,
    backgroundColor: '#C9A24B',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 1,
  },
  subtitle: {
    fontSize: isTablet ? 18 : isSmallDevice ? 13 : 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  loader: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: isTablet ? 100 : 70,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#C9A24B',
    marginHorizontal: 5,
  },
});