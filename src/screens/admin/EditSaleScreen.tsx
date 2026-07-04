import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { CustomButton, CustomInput, useToast } from "../../components";
import { useAppDispatch } from "../../store/hooks";
import { updateSale } from "../../store/slices/salesSlice";
import { useTheme } from "../../theme/ThemeContext";
import { SaleWithDetails } from "../../types";
import * as db from "../../services/database";
import { Modal } from "react-native";

export function EditSaleScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

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

    const result = await dispatch(
      updateSale({
        id: saleId,
        data: {
          items,
          subtotal,
          discount: disc,
          grandTotal,
          profit: sale.profit,
        },
      }),
    );
    setSaving(false);

    if (updateSale.fulfilled.match(result)) {
      showToast("Sale updated successfully");
      // navigation.goBack();
      navigation.navigate("Reports", {
        initialTab: "Ledger",
      });
    } else {
      showToast((result.payload as string) || "Failed to update", "error");
    }
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
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
      <Modal
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
      </Modal>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
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
});
