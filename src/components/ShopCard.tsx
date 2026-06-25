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

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]}>{shop.shopName}</Text>
      <Text style={[styles.owner, { color: colors.textSecondary }]}>{shop.ownerName} • {shop.phoneNumber}</Text>
      <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={1}>{shop.address}</Text>
      <View style={styles.footer}>
        <View>
          <Text style={[styles.label, { color: colors.textMuted }]}>Outstanding</Text>
          <Text style={[styles.balance, { color: highBalance ? colors.error : colors.warning }]}>
            {formatCurrency(shop.outstandingBalance)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Credit Limit</Text>
          <Text style={[styles.limit, { color: colors.text }]}>{formatCurrency(shop.creditLimit)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  owner: { fontSize: 14, marginTop: 4 },
  address: { fontSize: 13, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  balance: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  limit: { fontSize: 14, fontWeight: '600', marginTop: 2 },
});
