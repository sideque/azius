import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Shop } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  shop: Shop;
  onPress?: () => void;
}

export function ShopCard({ shop, onPress }: Props) {
  const { colors } = useTheme();
  const highBalance = shop.outstandingBalance > shop.creditLimit * 0.8 && shop.creditLimit > 0;
  const initials = shop.shopName.substring(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{shop.shopName}</Text>
          <Text style={[styles.owner, { color: colors.textSecondary }]}>{shop.ownerName} • {shop.phoneNumber}</Text>
          <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={1}>{shop.address}</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.footer}>
        <View>
          <Text style={[styles.label, { color: colors.textMuted }]}>OUTSTANDING</Text>
          <Text style={[styles.balance, { color: highBalance ? colors.error : colors.warning }]}>
            {formatCurrency(shop.outstandingBalance)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>CREDIT LIMIT</Text>
          <Text style={[styles.limit, { color: colors.text }]}>{formatCurrency(shop.creditLimit)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700' },
  owner: { fontSize: 13, marginTop: 3 },
  address: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  balance: { fontSize: 17, fontWeight: '800', marginTop: 4 },
  limit: { fontSize: 15, fontWeight: '700', marginTop: 4 },
});
