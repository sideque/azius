import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish, opacity, scale]);

  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SD</Text>
        </View>
        <Text style={styles.title}>Supplier Distribution</Text>
        <Text style={styles.subtitle}>Management System</Text>
      </Animated.View>
      <Animated.View style={[styles.loader, { opacity }]}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotDelay]} />
        <View style={[styles.dot, styles.dotDelay2]} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 100, height: 100, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  logoText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 24, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' },
  loader: { flexDirection: 'row', position: 'absolute', bottom: 80 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  dotDelay: { opacity: 0.6 },
  dotDelay2: { opacity: 0.3 },
});
