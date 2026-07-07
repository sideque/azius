import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../types';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  shop: Shop;
  onPress?: () => void;
  onDelete?: () => void;
}

export function ShopCard({ shop, onPress, onDelete }: Props) {
  const { colors } = useTheme();
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
        {onDelete && (
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [
              styles.deleteBtn,
              { backgroundColor: colors.errorLight },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </Pressable>
        )}
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
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
