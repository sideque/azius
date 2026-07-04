import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: IoniconsName;
}

export function DashboardCard({ title, value, subtitle, color, icon }: Props) {
  const { colors } = useTheme();
  const accentColor = color ?? colors.primary;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accentColor }]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

export function SummaryCard({ title, value, color }: { title: string; value: string; color?: string }) {
  const { colors } = useTheme();
  const bg = color ?? colors.primaryLight;
  return (
    <View style={[styles.summary, { backgroundColor: bg }]}>
      <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 16,
    margin: 4,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 11, marginTop: 4 },
  summary: { borderRadius: 14, padding: 16, marginBottom: 10 },
  summaryTitle: { fontSize: 13, fontWeight: '500' },
  summaryValue: { fontSize: 22, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
});
