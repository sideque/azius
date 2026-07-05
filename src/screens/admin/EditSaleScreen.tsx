import React, { useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Modal as RNModal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  CustomButton,
  CustomInput,
  Modal,
  ProductCard,
  SearchBar,
  InvoiceCard,
  useToast,
} from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateSale } from "../../store/slices/salesSlice";
import { fetchProducts } from "../../store/slices/productSlice";
import { fetchShops } from "../../store/slices/shopSlice";
import { useTheme } from "../../theme/ThemeContext";
import { Product, SaleWithDetails } from "../../types";
import * as db from "../../services/database";
import { generateId } from "../../utils/formatters";
import { shareInvoicePdf, printInvoice } from "../../utils/invoice";

export function EditSaleScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const products = useAppSelector((s) => s.products.items);
  const shops = useAppSelector((s) => s.shops.items);

  const saleId = route.params?.saleId;
  const invoiceNumber = route.params?.invoiceNumber;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sale, setSale] = useState<SaleWithDetails | null>(null);

  const [items, setItems] = useState<SaleWithDetails["items"]>([]);
  const [discount, setDiscount] = useState("0");

  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQty, setEditQty] = useState("");
  const [editRate, setEditRate] = useState("");

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemSearch, setAddItemSearch] = useState("");
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareViaWhatsApp, setShareViaWhatsApp] = useState(false);
  const [sharePhoneNumber, setSharePhoneNumber] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [updatedSale, setUpdatedSale] = useState<SaleWithDetails | null>(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (!saleId) {
      navigation.goBack();
      return;
    }
    const loadSale = async () => {
      try {
        const details = await db.getSaleByInvoiceNumber(invoiceNumber);
        if (details) {
          setSale(details);
          setItems(details.items);
          setDiscount(details.discount.toString());
        } else {
          showToast("Sale not found", "error");
          navigation.goBack();
        }
      } catch (e) {
        showToast("Failed to load sale", "error");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadSale();
  }, [saleId, invoiceNumber]);

  useEffect(() => {
    if (sale) {
      const shop = shops.find((s) => s.id === sale.shopId);
      if (shop?.phoneNumber) {
        setSharePhoneNumber(shop.phoneNumber);
      }
    }
  }, [sale, shops]);

  const updateQuantity = (id: string, qty: number) => {
    setItems(
      items.map((i) =>
        i.id === id ? { ...i, quantity: qty, total: qty * i.rate } : i,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const filteredAddProducts = products.filter((p) => {
    const term = addItemSearch.trim().toLowerCase();
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
    setShowAddItemModal(false);
    setShowQuantityModal(true);
  };

  const handleAddItemToSale = () => {
    if (!pendingProduct) return;
    const quantity = Number.parseFloat(quantityInput);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }
    if (quantity > pendingProduct.stockQuantity) {
      showToast("Quantity exceeds available stock", "error");
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === pendingProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === pendingProduct.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                total: (i.quantity + quantity) * i.rate,
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: generateId(),
          saleId,
          productId: pendingProduct.id,
          quantity,
          rate: pendingProduct.sellingPrice,
          total: quantity * pendingProduct.sellingPrice,
          productName: pendingProduct.productName,
        },
      ];
    });

    showToast(`${pendingProduct.productName} added to bill`);
    setShowQuantityModal(false);
    setPendingProduct(null);
    setQuantityInput("1");
    setShowAddItemModal(true);
  };

  const handleSave = async () => {
    if (!sale) return;
    if (items.length === 0) {
      showToast("Sale must have at least one item", "error");
      return;
    }

    setSaving(true);
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const disc = parseFloat(discount) || 0;
    const grandTotal = Math.max(0, subtotal - disc);
    const totalCost = items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      return acc + (product?.purchasePrice ?? 0) * item.quantity;
    }, 0);
    const profit = grandTotal - totalCost;

    const result = await dispatch(
      updateSale({
        id: saleId,
        data: {
          items,
          subtotal,
          discount: disc,
          grandTotal,
          profit,
        },
      }),
    );
    setSaving(false);

    if (updateSale.fulfilled.match(result)) {
      showToast("Sale updated successfully");
      setUpdatedSale({
        ...sale,
        items,
        subtotal,
        discount: disc,
        grandTotal,
        profit,
      });
      setShowShareModal(true);
    } else {
      showToast((result.payload as string) || "Failed to update", "error");
    }
  };

  const handleShareInvoice = async (saleToShare: SaleWithDetails) => {
    try {
      const shared = await shareInvoicePdf(saleToShare);
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

  const handlePrintInvoice = async (saleToPrint: SaleWithDetails) => {
    try {
      await printInvoice(saleToPrint);
      return true;
    } catch (error) {
      console.error("Failed to print invoice:", error);
      showToast("Failed to open printer dialog", "error");
      return false;
    }
  };

  const handleShareDecision = async (shouldShare: boolean) => {
    if (shouldShare && updatedSale) {
      await handleShareInvoice(updatedSale);
    }
    setShowShareModal(false);
    setShowInvoiceModal(true);
  };

  const finishEditing = () => {
    setShowInvoiceModal(false);
    setUpdatedSale(null);
    setShareViaWhatsApp(false);
    navigation.navigate("Reports", { initialTab: "Ledger" });
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={{ marginTop: 40 }}
      />
    );
  }

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = Math.max(0, subtotal - (parseFloat(discount) || 0));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      {sale && (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: colors.textSecondary }}>Shop</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
            {sale.shopName}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            Invoice Number
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {sale.invoiceNumber}
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
          Items
        </Text>
        <Pressable
          onPress={() => setShowAddItemModal(true)}
          style={({ pressed }) => [
            styles.addItemBtn,
            { backgroundColor: colors.primaryLight },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
            Add Item
          </Text>
        </Pressable>
      </View>

      {items.map((item) => (
        <View
          key={item.id}
          style={[
            styles.itemCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>
              {item.productName}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              ₹{item.rate} each
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() =>
                updateQuantity(item.id, Math.max(1, item.quantity - 1))
              }
              style={[styles.qtyBtn, { backgroundColor: colors.primaryLight }]}
            >
              <Ionicons name="remove" size={18} color={colors.primary} />
            </Pressable>

            <Text
              style={{ marginHorizontal: 12, color: colors.text, fontSize: 16 }}
            >
              {item.quantity}
            </Text>

            <Pressable
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              style={[styles.qtyBtn, { backgroundColor: colors.primaryLight }]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
            </Pressable>

            {/* Edit Button */}
            <Pressable
              onPress={() => {
                setEditingItem(item);
                setEditQty(item.quantity.toString());
                setEditRate(item.rate.toString());
              }}
              style={[
                styles.qtyBtn,
                {
                  backgroundColor: colors.primaryLight,
                  marginLeft: 10,
                },
              ]}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            </Pressable>

            {/* Delete Button */}
            <Pressable
              onPress={() => removeItem(item.id)}
              style={[
                styles.qtyBtn,
                {
                  backgroundColor: colors.error + "20",
                  marginLeft: 10,
                },
              ]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      ))}

      <View
        style={[
          styles.summary,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
          <Text style={{ color: colors.text }}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <CustomInput
          label="Discount (₹)"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="decimal-pad"
        />
        <View
          style={[
            styles.summaryRow,
            {
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 12,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}>
            Grand Total
          </Text>
          <Text
            style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }}
          >
            ₹{grandTotal.toFixed(2)}
          </Text>
        </View>
      </View>

      <CustomButton
        title="Update Sale"
        onPress={handleSave}
        loading={saving}
        style={{ marginTop: 16 }}
      />
      <CustomButton
        title="Back"
        onPress={() => navigation.navigate("Reports", { initialTab: "Ledger" })}
        style={{ marginTop: 12 }}
      />

      {/* Add Item modal — browse products and add them to this bill */}
      <Modal
        visible={showAddItemModal}
        title="Add Item"
        onClose={() => setShowAddItemModal(false)}
      >
        <SearchBar
          value={addItemSearch}
          onChangeText={setAddItemSearch}
          placeholder="Search products..."
        />
        <FlatList
          data={filteredAddProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onAdd={() => handlePromptQuantity(item)} />
          )}
          style={{ maxHeight: 400 }}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 12 }}>
              No products found
            </Text>
          }
        />
      </Modal>

      {/* Quantity prompt for a product being added */}
      <Modal
        visible={showQuantityModal}
        title="Select Quantity"
        onClose={() => {
          setShowQuantityModal(false);
          setPendingProduct(null);
          setQuantityInput("1");
          setShowAddItemModal(true);
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 12 }}>
          {pendingProduct?.productName}
        </Text>
        <CustomInput
          label="Quantity"
          value={quantityInput}
          onChangeText={setQuantityInput}
          keyboardType="decimal-pad"
          placeholder="e.g. 1.5"
        />
        <CustomButton
          title="Add to Bill"
          onPress={handleAddItemToSale}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Share invoice after saving */}
      <Modal
        visible={showShareModal}
        title="Share Invoice"
        onClose={() => handleShareDecision(false)}
      >
        <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>
          Share the updated invoice on WhatsApp?
        </Text>
        <View style={styles.shareToggleRow}>
          <Pressable
            style={[
              styles.shareOption,
              { borderColor: colors.border },
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
              { borderColor: colors.border },
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
            placeholder="Enter phone number"
          />
        )}
        <CustomButton
          title="Continue"
          onPress={() => handleShareDecision(shareViaWhatsApp)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Final invoice preview */}
      <Modal visible={showInvoiceModal} title="Invoice" onClose={finishEditing}>
        {updatedSale && <InvoiceCard sale={updatedSale} />}
        {updatedSale && (
          <View style={styles.modalActionRow}>
            <CustomButton
              title="Share PDF"
              onPress={() => handleShareInvoice(updatedSale)}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <CustomButton
              title="Print Receipt"
              onPress={() => handlePrintInvoice(updatedSale)}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        )}
        <CustomButton title="Done" onPress={finishEditing} style={{ marginTop: 16 }} />
      </Modal>

      {/* Edit item quantity/rate */}
      <RNModal
        visible={!!editingItem}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              width: "90%",
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 20,
              }}
            >
              Edit Item
            </Text>

            <CustomInput
              label="Quantity"
              value={editQty}
              onChangeText={setEditQty}
              keyboardType="number-pad"
            />

            <CustomInput
              label="Rate"
              value={editRate}
              onChangeText={setEditRate}
              keyboardType="decimal-pad"
            />

            <CustomButton
              title="Save Changes"
              onPress={() => {
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === editingItem.id
                      ? {
                          ...i,
                          quantity: Number(editQty),
                          rate: Number(editRate),
                          total: Number(editQty) * Number(editRate),
                        }
                      : i,
                  ),
                );

                setEditingItem(null);
              }}
            />

            <View style={{ height: 10 }} />

            <CustomButton title="Cancel" onPress={() => setEditingItem(null)} />
          </View>
        </View>
      </RNModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  infoCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  itemCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
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
