import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface Props {
  title?: string;
  message?: string;
  icon?: IoniconsName;
}

export function EmptyState({ title = 'No Data', message = 'Nothing to display yet', icon = 'file-tray-outline' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 40, paddingVertical: 60 },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  message: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});
