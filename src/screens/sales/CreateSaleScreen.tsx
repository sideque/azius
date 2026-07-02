import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  CustomButton,
  CustomInput,
  Dropdown,
  EmptyState,
  InvoiceCard,
  Modal,
  ProductCard,
  SearchBar,
  useToast,
} from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchProducts } from "../../store/slices/productSlice";
import { fetchShops } from "../../store/slices/shopSlice";
import {
  addToCart,
  clearCart,
  clearCartInFirebase,
  createSale,
  loadCartFromFirebase,
  removeFromCart,
  setDiscount,
  setSelectedShop,
  syncCartToFirebase,
  updateCartQuantity,
} from "../../store/slices/salesSlice";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/formatters";
import { Product, SaleWithDetails } from "../../types";

export function CreateSaleScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const products = useAppSelector((s) => s.products.items);
  const shops = useAppSelector((s) => s.shops.items);
  const user = useAppSelector((s) => s.auth.user);
  const { cart, selectedShopId, discount, loading, lastSale } = useAppSelector(
    (s) => s.sales,
  );
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [discountInput, setDiscountInput] = useState("0");
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const [shareViaWhatsApp, setShareViaWhatsApp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sharePhoneNumber, setSharePhoneNumber] = useState("");
  const [pendingInvoice, setPendingInvoice] = useState<SaleWithDetails | null>(
    null,
  );

  const load = useCallback(() => {
    dispatch(fetchProducts());
    dispatch(fetchShops());
  }, [dispatch]);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        dispatch(fetchProducts()).unwrap(),
        dispatch(fetchShops()).unwrap(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (user?.id) {
      dispatch(loadCartFromFirebase(user.id));
    }
  }, [dispatch, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shopOptions = shops.map((s) => ({
    label: `${s.shopName} (${s.ownerName})`,
    value: s.id,
  }));
  const selectedShop = shops.find((shop) => shop.id === selectedShopId);
  const subtotal = cart.reduce((s, c) => s + c.quantity * c.rate, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const filteredProducts = products.filter((p) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const productName = p.productName?.toLowerCase() ?? "";
    const productCode = p.productCode?.toLowerCase() ?? "";
    return productName.includes(term) || productCode.includes(term);
  });

  const handlePromptQuantity = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast("Product out of stock", "error");
      return;
    }
    setPendingProduct(product);
    setQuantityInput("1");
    setShowQuantityModal(true);
  };

  const handleAddProduct = () => {
    if (!pendingProduct) return;

    const quantity = Number.parseFloat(quantityInput);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }
    if (quantity > pendingProduct.stockQuantity) {
      showToast("Quantity exceeds stock", "error");
      return;
    }

    dispatch(
      addToCart({
        productId: pendingProduct.id,
        productName: pendingProduct.productName,
        productCode: pendingProduct.productCode,
        quantity,
        rate: pendingProduct.sellingPrice,
        purchasePrice: pendingProduct.purchasePrice,
        stockQuantity: pendingProduct.stockQuantity,
        unit: pendingProduct.unit,
      }),
    );
    if (user?.id) {
      dispatch(syncCartToFirebase());
    }
    showToast(`${pendingProduct.productName} added to cart`);
    setShowQuantityModal(false);
    setPendingProduct(null);
    setQuantityInput("1");
  };

  useEffect(() => {
    if (selectedShop?.phoneNumber) {
      setSharePhoneNumber(selectedShop.phoneNumber);
    }
  }, [selectedShop?.phoneNumber]);

  const buildInvoiceMessage = (sale: SaleWithDetails) => {
    const lines = [
      `Invoice: ${sale.invoiceNumber}`,
      `Shop: ${sale.shopName}`,
      `Date: ${sale.createdAt}`,
    ];
    sale.items.forEach((item) => {
      lines.push(
        `${item.productName} x${item.quantity} = ${formatCurrency(item.total)}`,
      );
    });
    lines.push(`Subtotal: ${formatCurrency(sale.subtotal)}`);
    if (sale.discount > 0) {
      lines.push(`Discount: -${formatCurrency(sale.discount)}`);
    }
    lines.push(`Grand Total: ${formatCurrency(sale.grandTotal)}`);
    return lines.join("\n");
  };

  const handleShareInvoice = async (sale: SaleWithDetails) => {
    const cleanedPhone = sharePhoneNumber.replace(/\D/g, "");
    if (!cleanedPhone) {
      showToast("Please enter a phone number to share the invoice", "error");
      return false;
    }

    const message = buildInvoiceMessage(sale);
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    const fallbackUrl = `whatsapp://send?phone=${cleanedPhone}&text=${encodedText}`;

    try {
      const canOpen = await Linking.canOpenURL(waUrl);
      await Linking.openURL(canOpen ? waUrl : fallbackUrl);
      return true;
    } catch {
      showToast("Unable to open WhatsApp", "error");
      return false;
    }
  };

  const handleSaveSale = async () => {
    if (!selectedShopId) {
      showToast("Please select a shop", "error");
      return;
    }
    const result = await dispatch(createSale());
    if (createSale.fulfilled.match(result)) {
      const salePayload = result.payload as SaleWithDetails;
      setPendingInvoice(salePayload);
      setShowShareModal(true);
      setShowCart(false);
      dispatch(fetchProducts());
      dispatch(fetchShops());
      showToast("Sale saved successfully!");
    } else {
      showToast((result.payload as string) ?? "Failed to save sale", "error");
    }
  };

  const handleShareDecision = async (shouldShare: boolean) => {
    if (shouldShare && pendingInvoice) {
      await handleShareInvoice(pendingInvoice);
    }
    setShowShareModal(false);
    setShowInvoice(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Dropdown
        label="Select Shop"
        options={shopOptions}
        value={selectedShopId ?? ""}
        onChange={(v) => dispatch(setSelectedShop(v))}
        placeholder="Choose a shop..."
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search products..."
      />

      {/* <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No Products" icon="📦" />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={() => handlePromptQuantity(item)}
          />
        )}
        style={{ flex: 1 }}
      /> */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState title="No Products" icon="📦" />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={() => handlePromptQuantity(item)}
          />
        )}
        style={{ flex: 1 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {cart.length > 0 && (
        <Pressable
          style={[styles.cartBar, { backgroundColor: colors.primary }]}
          onPress={() => setShowCart(true)}
        >
          <Text style={styles.cartText}>
            🛒 {cart.length} items • {formatCurrency(grandTotal)}
          </Text>
          <Text style={styles.cartText}>View Cart →</Text>
        </Pressable>
      )}

      <Modal visible={showCart} title="Cart" onClose={() => setShowCart(false)}>
        <ScrollView style={{ maxHeight: 400 }}>
          {cart.map((item) => (
            <View
              key={item.productId}
              style={[styles.cartItem, { borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {item.productName}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  {formatCurrency(item.rate)}/{item.unit}
                </Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable
                  onPress={() => {
                    dispatch(
                      updateCartQuantity({
                        productId: item.productId,
                        quantity: item.quantity - 1,
                      }),
                    );
                    if (user?.id) dispatch(syncCartToFirebase());
                  }}
                  style={[styles.qtyBtn, { backgroundColor: colors.border }]}
                >
                  <Text>-</Text>
                </Pressable>
                <Text
                  style={{
                    color: colors.text,
                    marginHorizontal: 12,
                    fontWeight: "700",
                  }}
                >
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => {
                    if (item.quantity >= item.stockQuantity)
                      showToast("Max stock reached", "error");
                    else {
                      dispatch(
                        updateCartQuantity({
                          productId: item.productId,
                          quantity: item.quantity + 1,
                        }),
                      );
                      if (user?.id) dispatch(syncCartToFirebase());
                    }
                  }}
                  style={[styles.qtyBtn, { backgroundColor: colors.border }]}
                >
                  <Text>+</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  dispatch(removeFromCart(item.productId));
                  if (user?.id) dispatch(syncCartToFirebase());
                }}
              >
                <Text style={{ color: colors.error, marginLeft: 8 }}>✕</Text>
              </Pressable>
            </View>
          ))}
          <CustomInput
            label="Discount (₹)"
            value={discountInput}
            onChangeText={(v) => {
              setDiscountInput(v);
              dispatch(setDiscount(parseFloat(v) || 0));
              if (user?.id) dispatch(syncCartToFirebase());
            }}
            keyboardType="decimal-pad"
          />
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
            <Text style={{ color: colors.text }}>
              {formatCurrency(subtotal)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              Grand Total
            </Text>
            <Text
              style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}
            >
              {formatCurrency(grandTotal)}
            </Text>
          </View>
          <CustomButton
            title="Generate Invoice & Save"
            onPress={handleSaveSale}
            loading={loading}
            style={{ marginTop: 16 }}
          />
          <CustomButton
            title="Clear Cart"
            onPress={() => {
              dispatch(clearCart());
              if (user?.id) dispatch(clearCartInFirebase());
            }}
            variant="outline"
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </Modal>

      <Modal
        visible={showQuantityModal}
        title="Select Quantity"
        onClose={() => {
          setShowQuantityModal(false);
          setPendingProduct(null);
          setQuantityInput("1");
        }}
      >
        <CustomInput
          label="Quantity"
          value={quantityInput}
          onChangeText={setQuantityInput}
          keyboardType="decimal-pad"
          placeholder="e.g. 1.5"
        />
        <CustomButton
          title="Add to Cart"
          onPress={handleAddProduct}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        visible={showShareModal}
        title="Share Invoice"
        onClose={() => handleShareDecision(false)}
      >
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
          Share this invoice on WhatsApp?
        </Text>
        <View style={styles.shareToggleRow}>
          <Pressable
            style={[
              styles.shareOption,
              shareViaWhatsApp && { backgroundColor: colors.primary },
            ]}
            onPress={() => setShareViaWhatsApp(true)}
          >
            <Text style={{ color: shareViaWhatsApp ? "#fff" : colors.text }}>
              Yes
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.shareOption,
              !shareViaWhatsApp && { backgroundColor: colors.border },
            ]}
            onPress={() => setShareViaWhatsApp(false)}
          >
            <Text
              style={{
                color: !shareViaWhatsApp ? colors.text : colors.textSecondary,
              }}
            >
              No
            </Text>
          </Pressable>
        </View>
        {shareViaWhatsApp && (
          <CustomInput
            label="WhatsApp Number"
            value={sharePhoneNumber}
            onChangeText={setSharePhoneNumber}
            keyboardType="phone-pad"
            placeholder={selectedShop?.phoneNumber ?? "Enter phone number"}
          />
        )}
        <CustomButton
          title="Continue"
          onPress={() => handleShareDecision(shareViaWhatsApp)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        visible={showInvoice}
        title="Invoice"
        onClose={() => {
          setShowInvoice(false);
          dispatch(clearCart());
          if (user?.id) dispatch(clearCartInFirebase());
          setPendingInvoice(null);
          setShareViaWhatsApp(false);
          setSharePhoneNumber(selectedShop?.phoneNumber ?? "");
        }}
      >
        {lastSale && <InvoiceCard sale={lastSale} />}
        <CustomButton
          title="Done"
          onPress={() => {
            setShowInvoice(false);
            dispatch(clearCart());
            if (user?.id) dispatch(clearCartInFirebase());
            setPendingInvoice(null);
            setShareViaWhatsApp(false);
            setSharePhoneNumber(selectedShop?.phoneNumber ?? "");
          }}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cartBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cartText: { color: "#fff", fontWeight: "700" },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  shareToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  shareOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
