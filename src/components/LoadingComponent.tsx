import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function LoadingComponent({ fullScreen }: { fullScreen?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, fullScreen && styles.full]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.textMuted }]}>Loading...</Text>
    </View>
  );
}

export function LoadingSkeleton() {
  const { colors } = useTheme();
  const rows = [1, 2, 3, 4];
  return (
    <View style={styles.skeletonContainer}>
      {rows.map((i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '70%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '50%' }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  full: { flex: 1 },
  label: { marginTop: 12, fontSize: 13, fontWeight: '500' },
  skeletonContainer: { padding: 16 },
  skeletonCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  skeletonTitle: { height: 16, borderRadius: 8, marginBottom: 10, opacity: 0.5 },
  skeletonLine: { height: 11, borderRadius: 6, marginBottom: 8, opacity: 0.35 },
});
