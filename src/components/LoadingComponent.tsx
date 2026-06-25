import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function LoadingComponent({ fullScreen }: { fullScreen?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, fullScreen && styles.full]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function LoadingSkeleton() {
  const { colors } = useTheme();
  return (
    <View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeleton, { backgroundColor: colors.border }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  full: { flex: 1 },
  skeleton: { height: 80, borderRadius: 12, marginBottom: 10, opacity: 0.5 },
});
