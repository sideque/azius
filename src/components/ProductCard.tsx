import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  const lowStock = product.stockQuantity <= 20;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{product.productName}</Text>
          <Text style={[styles.code, { color: colors.textSecondary }]}>{product.productCode} • {product.category}</Text>
        </View>
        {onAdd && (
          <Pressable onPress={onAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.addText}>+</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(product.sellingPrice)}/{product.unit}</Text>
        {showStock && (
          <Text style={[styles.stock, { color: lowStock ? colors.error : colors.success }]}>
            Stock: {product.stockQuantity}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  code: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: -2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 15, fontWeight: '700' },
  stock: { fontSize: 13, fontWeight: '500' },
});
