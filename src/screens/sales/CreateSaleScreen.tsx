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
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
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
import { formatCurrency, formatDateTime } from "../../utils/formatters";
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

  const generateInvoiceHtml = (sale: SaleWithDetails) => {
    const itemsHtml = sale.items
      .map(
        (item) => `
        <tr>
          <td>
            <div class="item-desc">${item.productName}</div>
            <div class="item-qty-rate">${item.quantity} x ${formatCurrency(item.rate)}</div>
          </td>
          <td class="item-total">${formatCurrency(item.total)}</td>
        </tr>
      `
      )
      .join("");

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Invoice</title>
    <style>
      @page {
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: #fff;
      }
      .receipt-container {
        margin: 0 auto;
        padding: 10px;
        width: 280px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 11px;
        line-height: 1.3;
        color: #000;
      }
      .header {
        text-align: center;
        margin-bottom: 12px;
      }
      .shop-name {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 3px;
      }
      .title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        padding: 3px 0;
        margin-bottom: 10px;
      }
      .meta-table {
        width: 100%;
        margin-bottom: 10px;
        border-collapse: collapse;
      }
      .meta-table td {
        padding: 1px 0;
        font-size: 10px;
        vertical-align: top;
      }
      .meta-label {
        color: #555;
        width: 80px;
      }
      .meta-value {
        font-weight: 600;
        text-align: right;
      }
      .divider {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      .items-table {
        width: 100%;
        border-collapse: collapse;
      }
      .items-table th {
        text-align: left;
        font-size: 10px;
        font-weight: 700;
        border-bottom: 1px solid #000;
        padding-bottom: 4px;
      }
      .items-table td {
        padding: 5px 0;
        font-size: 10px;
        border-bottom: 1px dashed #eee;
      }
      .item-desc {
        font-weight: 600;
        color: #111;
      }
      .item-qty-rate {
        color: #555;
        font-size: 9px;
        margin-top: 1px;
      }
      .item-total {
        text-align: right;
        font-weight: 700;
        font-size: 11px;
        vertical-align: middle;
      }
      .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      .summary-table td {
        padding: 2px 0;
        font-size: 10px;
      }
      .summary-label {
        color: #444;
      }
      .summary-value {
        text-align: right;
        font-weight: 600;
      }
      .grand-total-row td {
        border-top: 1px double #000;
        padding-top: 6px;
      }
      .grand-total-label {
        font-size: 12px;
        font-weight: 800;
      }
      .grand-total-value {
        font-size: 14px;
        font-weight: 800;
        color: #000;
        text-align: right;
      }
      .footer {
        text-align: center;
        margin-top: 15px;
        font-size: 9px;
        color: #555;
      }
      .thankyou {
        font-size: 10px;
        font-weight: 700;
        margin-bottom: 3px;
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="header">
        <div class="shop-name">SAIF MARKETING</div>
        <div class="title">Sales Invoice</div>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Invoice:</td>
          <td class="meta-value">${sale.invoiceNumber}</td>
        </tr>
        <tr>
          <td class="meta-label">Customer:</td>
          <td class="meta-value">${sale.shopName}</td>
        </tr>
        <tr>
          <td class="meta-label">Date:</td>
          <td class="meta-value">${formatDateTime(sale.createdAt)}</td>
        </tr>
      </table>

      <div class="divider"></div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 70%;">Item Description</th>
            <th style="text-align: right; width: 30%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="divider"></div>

      <table class="summary-table">
        <tr>
          <td class="summary-label">Subtotal:</td>
          <td class="summary-value">${formatCurrency(sale.subtotal)}</td>
        </tr>
        ${
          sale.discount > 0
            ? `
        <tr>
          <td class="summary-label">Discount:</td>
          <td class="summary-value" style="color: #d93025;">-${formatCurrency(sale.discount)}</td>
        </tr>
        `
            : ""
        }
        <tr class="grand-total-row">
          <td class="grand-total-label">Grand Total:</td>
          <td class="grand-total-value">${formatCurrency(sale.grandTotal)}</td>
        </tr>
      </table>

      <div class="divider"></div>

      <div class="footer">
        <div class="thankyou">Thank you for shopping with us!</div>
        <div>Powered by SAIF MARKETING</div>
      </div>
    </div>
  </body>
  </html>
  `;
  };

  const handleShareInvoice = async (sale: SaleWithDetails) => {
    try {
      const html = generateInvoiceHtml(sale);
      // Generate the PDF directly as a Base64 string
      const { base64 } = await Print.printToFileAsync({
        html,
        width: 300,
        height: 380 + (sale.items.length * 45),
        base64: true,
      });

      if (!base64) {
        throw new Error("No base64 data returned from PDF generation");
      }

      // Save the PDF base64 directly to our custom cache directory file.
      // This completely avoids any Android file-locking or permission issues with the /Print/ folder!
      const cleanInvoiceNum = sale.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
      const targetUri = `${FileSystem.cacheDirectory}${cleanInvoiceNum}.pdf`;

      await FileSystem.writeAsStringAsync(targetUri, base64, {
        encoding: "base64",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: "application/pdf",
          dialogTitle: `Share Invoice ${sale.invoiceNumber}`,
          UTI: "com.adobe.pdf",
        });
        return true;
      } else {
        showToast("Sharing is not available on this device", "error");
        return false;
      }
    } catch (error) {
      console.error("Failed to share invoice PDF:", error);
      showToast("Failed to generate PDF receipt", "error");
      return false;
    }
  };

  const handlePrintInvoice = async (sale: SaleWithDetails) => {
    try {
      const html = generateInvoiceHtml(sale);
      await Print.printAsync({
        html,
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
