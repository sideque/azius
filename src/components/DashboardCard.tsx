import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export function DashboardCard({ title, value, subtitle, color, icon }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: color ?? colors.text }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

export function SummaryCard({ title, value, color }: { title: string; value: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summary, { backgroundColor: color ?? colors.primaryLight }]}>
      <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 16, margin: 4, borderWidth: 1 },
  icon: { fontSize: 24, marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  subtitle: { fontSize: 11, marginTop: 4 },
  summary: { borderRadius: 12, padding: 16, marginBottom: 10 },
  summaryTitle: { fontSize: 13, fontWeight: '500' },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
});
