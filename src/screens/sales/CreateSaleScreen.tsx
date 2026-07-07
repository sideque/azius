import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
  updateCartRate,
} from "../../store/slices/salesSlice";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/formatters";
import { shareInvoicePdf, printInvoice } from "../../utils/invoice";
import { CartItem, Product, SaleWithDetails } from "../../types";

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
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pendingPriceItem, setPendingPriceItem] = useState<CartItem | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [includeOwnerName, setIncludeOwnerName] = useState(false);
  const [pendingOwnerName, setPendingOwnerName] = useState("");

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

  const parsedQuantity = Number.parseFloat(quantityInput);
  const quantityError =
    pendingProduct &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > pendingProduct.stockQuantity
      ? `Out of stock — only ${pendingProduct.stockQuantity} ${pendingProduct.unit || "unit"} available`
      : undefined;

  const handlePromptQuantity = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast("Product out of stock", "error");
      return;
    }
    setPendingProduct(product);
    setQuantityInput("1");
    setShowQuantityModal(true);
  };

  const handlePromptPrice = (item: CartItem) => {
    setPendingPriceItem(item);
    setPriceInput(item.rate.toString());
    setShowPriceModal(true);
  };

  const handleUpdatePrice = () => {
    if (!pendingPriceItem) return;
    const rate = Number.parseFloat(priceInput);
    if (!Number.isFinite(rate) || rate < 0) {
      showToast("Please enter a valid price", "error");
      return;
    }
    dispatch(
      updateCartRate({
        productId: pendingPriceItem.productId,
        rate,
      }),
    );
    if (user?.id) {
      dispatch(syncCartToFirebase());
    }
    showToast(`Price updated for ${pendingPriceItem.productName}`);
    setShowPriceModal(false);
    setPendingPriceItem(null);
    setPriceInput("");
  };

  const handleAddProduct = () => {
    if (!pendingProduct) return;

    const quantity = Number.parseFloat(quantityInput);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }
    if (quantity > pendingProduct.stockQuantity) {
      showToast(
        `Out of stock — only ${pendingProduct.stockQuantity} ${pendingProduct.unit || "unit"} available`,
        "error",
      );
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

  const handleShareInvoice = async (sale: SaleWithDetails) => {
    try {
      const shared = await shareInvoicePdf(sale, {
        includeOwnerName,
        ownerName: pendingOwnerName,
      });
      if (!shared) {
        showToast("Sharing is not available on this device", "error");
      }
      return shared;
    } catch (error) {
      console.error("Failed to share invoice PDF:", error);
      showToast("Failed to generate PDF receipt", "error");
      return false;
    }
  };

  const handlePrintInvoice = async (sale: SaleWithDetails) => {
    try {
      await printInvoice(sale, {
        includeOwnerName,
        ownerName: pendingOwnerName,
      });
      return true;
    } catch (error) {
      console.error("Failed to print invoice:", error);
      showToast("Failed to open printer dialog", "error");
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
      setPendingOwnerName(selectedShop?.ownerName ?? "");
      setShowShareModal(true);
      setShowCart(false);
      dispatch(fetchProducts());
      dispatch(fetchShops());
      showToast("Sale saved successfully!");
      setDiscountInput("0");
    } else {
      showToast((result.payload as string) ?? "Failed to save sale", "error");
    }
  };

  const handleShareDecision = async (shouldShare: boolean) => {
    if (shouldShare && pendingInvoice) {
      await handleShareInvoice(pendingInvoice);
    }
    dispatch(clearCart());
    if (user?.id) dispatch(clearCartInFirebase());
    setShowShareModal(false);
    setShowInvoice(true);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
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
        ListEmptyComponent={<EmptyState title="No Products" icon="cube-outline" />}
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="cart" size={16} color="#fff" />
            <Text style={styles.cartText}>
              {cart.length} items • {formatCurrency(grandTotal)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Text style={styles.cartText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </View>
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
                <Text style={{ color: colors.text, fontWeight: "600" }} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  {item.quantity} {item.unit || "unit"} × {formatCurrency(item.rate)} = {formatCurrency(item.quantity * item.rate)}
                </Text>
                <Pressable
                  onPress={() => handlePromptPrice(item)}
                  style={{ marginTop: 4, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="pencil-outline" size={12} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
                    Edit Price
                  </Text>
                </Pressable>
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
                  <Ionicons name="remove" size={14} color={colors.text} />
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
                  <Ionicons name="add" size={14} color={colors.text} />
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  dispatch(removeFromCart(item.productId));
                  if (user?.id) dispatch(syncCartToFirebase());
                }}
              >
                <Ionicons name="close" size={16} color={colors.error} style={{ marginLeft: 8 }} />
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
          {!selectedShopId && (
            <View style={[styles.warningBanner, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600", marginLeft: 6, flex: 1 }}>
                Please select a shop above before saving the sale.
              </Text>
            </View>
          )}
          <CustomButton
            title="Generate Invoice & Save"
            onPress={handleSaveSale}
            loading={loading}
            disabled={!selectedShopId}
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
          error={quantityError}
        />
        <CustomButton
          title="Add to Cart"
          onPress={handleAddProduct}
          disabled={!!quantityError}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        visible={showPriceModal}
        title="Edit Item Price"
        onClose={() => {
          setShowPriceModal(false);
          setPendingPriceItem(null);
          setPriceInput("");
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>
          {pendingPriceItem?.productName}
        </Text>
        <CustomInput
          label="Price per unit (₹)"
          value={priceInput}
          onChangeText={setPriceInput}
          keyboardType="decimal-pad"
          placeholder="e.g. 100"
        />
        <CustomButton
          title="Update Price"
          onPress={handleUpdatePrice}
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
        <Pressable
          onPress={() => setIncludeOwnerName((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Ionicons
            name={includeOwnerName ? "checkbox" : "square-outline"}
            size={20}
            color={colors.primary}
          />
          <Text style={{ color: colors.text, fontSize: 13, marginLeft: 8 }}>
            Include owner name in bill
          </Text>
        </Pressable>
        <CustomButton
          title="Continue"
          onPress={() => handleShareDecision(shareViaWhatsApp)}
          style={{ marginTop: 12 }}
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
          setIncludeOwnerName(false);
          setPendingOwnerName("");
          setSharePhoneNumber(selectedShop?.phoneNumber ?? "");
        }}
      >
        {lastSale && <InvoiceCard sale={lastSale} />}
        {lastSale && (
          <View style={styles.modalActionRow}>
            <CustomButton
              title="Share PDF"
              onPress={() => handleShareInvoice(lastSale)}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <CustomButton
              title="Print Receipt"
              onPress={() => handlePrintInvoice(lastSale)}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        )}
        <CustomButton
          title="Done"
          onPress={() => {
            setShowInvoice(false);
            dispatch(clearCart());
            if (user?.id) dispatch(clearCartInFirebase());
            setPendingInvoice(null);
            setShareViaWhatsApp(false);
            setIncludeOwnerName(false);
            setPendingOwnerName("");
            setSharePhoneNumber(selectedShop?.phoneNumber ?? "");
          }}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cartBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cartText: { color: "#fff", fontWeight: "700" },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  shareToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  shareOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
});
