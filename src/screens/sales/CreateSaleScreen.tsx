import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  CustomButton, CustomInput, Dropdown, EmptyState, InvoiceCard,
  Modal, ProductCard, SearchBar, useToast,
} from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchShops } from '../../store/slices/shopSlice';
import {
  addToCart, clearCart, createSale, removeFromCart,
  setDiscount, setSelectedShop, updateCartQuantity,
} from '../../store/slices/salesSlice';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import { Product } from '../../types';

export function CreateSaleScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const products = useAppSelector((s) => s.products.items);
  const shops = useAppSelector((s) => s.shops.items);
  const { cart, selectedShopId, discount, loading, lastSale } = useAppSelector((s) => s.sales);
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [discountInput, setDiscountInput] = useState('0');

  const load = useCallback(() => {
    dispatch(fetchProducts());
    dispatch(fetchShops());
  }, [dispatch]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shopOptions = shops.map((s) => ({ label: `${s.shopName} (${s.ownerName})`, value: s.id }));
  const subtotal = cart.reduce((s, c) => s + c.quantity * c.rate, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const filteredProducts = products.filter(
    (p) => !search || p.productName.toLowerCase().includes(search.toLowerCase()) || p.productCode.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddProduct = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast('Product out of stock', 'error');
      return;
    }
    dispatch(addToCart({
      productId: product.id,
      productName: product.productName,
      productCode: product.productCode,
      quantity: 1,
      rate: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      stockQuantity: product.stockQuantity,
      unit: product.unit,
    }));
    showToast(`${product.productName} added to cart`);
  };

  const handleSaveSale = async () => {
    if (!selectedShopId) {
      showToast('Please select a shop', 'error');
      return;
    }
    const result = await dispatch(createSale());
    if (createSale.fulfilled.match(result)) {
      showToast('Sale saved successfully!');
      setShowInvoice(true);
      setShowCart(false);
      dispatch(fetchProducts());
      dispatch(fetchShops());
    } else {
      showToast(result.payload as string ?? 'Failed to save sale', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Dropdown label="Select Shop" options={shopOptions} value={selectedShopId ?? ''} onChange={(v) => dispatch(setSelectedShop(v))} placeholder="Choose a shop..." />

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search products..." />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No Products" icon="📦" />}
        renderItem={({ item }) => (
          <ProductCard product={item} onAdd={() => handleAddProduct(item)} />
        )}
        style={{ flex: 1 }}
      />

      {cart.length > 0 && (
        <Pressable style={[styles.cartBar, { backgroundColor: colors.primary }]} onPress={() => setShowCart(true)}>
          <Text style={styles.cartText}>🛒 {cart.length} items • {formatCurrency(grandTotal)}</Text>
          <Text style={styles.cartText}>View Cart →</Text>
        </Pressable>
      )}

      <Modal visible={showCart} title="Cart" onClose={() => setShowCart(false)}>
        <ScrollView style={{ maxHeight: 400 }}>
          {cart.map((item) => (
            <View key={item.productId} style={[styles.cartItem, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{item.productName}</Text>
                <Text style={{ color: colors.textSecondary }}>{formatCurrency(item.rate)}/{item.unit}</Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable onPress={() => dispatch(updateCartQuantity({ productId: item.productId, quantity: item.quantity - 1 }))} style={[styles.qtyBtn, { backgroundColor: colors.border }]}>
                  <Text>-</Text>
                </Pressable>
                <Text style={{ color: colors.text, marginHorizontal: 12, fontWeight: '700' }}>{item.quantity}</Text>
                <Pressable
                  onPress={() => {
                    if (item.quantity >= item.stockQuantity) showToast('Max stock reached', 'error');
                    else dispatch(updateCartQuantity({ productId: item.productId, quantity: item.quantity + 1 }));
                  }}
                  style={[styles.qtyBtn, { backgroundColor: colors.border }]}
                >
                  <Text>+</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => dispatch(removeFromCart(item.productId))}>
                <Text style={{ color: colors.error, marginLeft: 8 }}>✕</Text>
              </Pressable>
            </View>
          ))}
          <CustomInput
            label="Discount (₹)"
            value={discountInput}
            onChangeText={(v) => { setDiscountInput(v); dispatch(setDiscount(parseFloat(v) || 0)); }}
            keyboardType="decimal-pad"
          />
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
            <Text style={{ color: colors.text }}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Grand Total</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>{formatCurrency(grandTotal)}</Text>
          </View>
          <CustomButton title="Generate Invoice & Save" onPress={handleSaveSale} loading={loading} style={{ marginTop: 16 }} />
          <CustomButton title="Clear Cart" onPress={() => dispatch(clearCart())} variant="outline" style={{ marginTop: 8 }} />
        </ScrollView>
      </Modal>

      <Modal visible={showInvoice} title="Invoice" onClose={() => { setShowInvoice(false); dispatch(clearCart()); }}>
        {lastSale && <InvoiceCard sale={lastSale} />}
        <CustomButton title="Done" onPress={() => { setShowInvoice(false); dispatch(clearCart()); }} style={{ marginTop: 16 }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cartBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginTop: 8 },
  cartText: { color: '#fff', fontWeight: '700' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
