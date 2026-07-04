import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  product: Product;
  onPress?: () => void;
  onAdd?: () => void;
  showStock?: boolean;
}

export function ProductCard({ product, onPress, onAdd, showStock = true }: Props) {
  const { colors } = useTheme();
  const lowStock = product.stockQuantity <= (product.minStock ?? 20);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{product.productName}</Text>
        </View>
        {onAdd && (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.9 }] },
            ]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        )}
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(product.sellingPrice)}/{product.unit}</Text>
        {showStock && (
          <View style={[styles.stockBadge, { backgroundColor: lowStock ? colors.errorLight : colors.successLight, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            {lowStock && <Ionicons name="warning-outline" size={12} color={colors.error} />}
            <Text style={[styles.stockText, { color: lowStock ? colors.error : colors.success }]}>
              Stock: {product.stockQuantity}
            </Text>
          </View>
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
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', flex: 1, lineHeight: 20 },
  tagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  categoryChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  code: { fontSize: 12 },
  divider: { height: 1, marginVertical: 10 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800' },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stockText: { fontSize: 12, fontWeight: '600' },
});
