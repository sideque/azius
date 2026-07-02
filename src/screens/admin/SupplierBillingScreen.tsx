import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  EmptyState,
  useToast,
} from "../../components";
import {
  createOrUpdateSupplierBill,
  getProducts,
  getSuppliers,
  getSupplierBill,
  updateProduct,
  updateSupplierBillData,
} from "../../services/database";
import { useTheme } from "../../theme/ThemeContext";
import { Product, Supplier, SupplierBillItem } from "../../types";
import { toISOString } from "../../utils/formatters";
import { AdminDrawerParamList } from "../../navigation/types";

export function SupplierBillingScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [billDate, setBillDate] = useState(new Date());
  const [items, setItems] = useState<SupplierBillItem[]>([]);
  const [originalItems, setOriginalItems] = useState<SupplierBillItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const route = useRoute<RouteProp<AdminDrawerParamList, "SupplierBilling">>();
  const billId = route.params?.billId;
  const isEditMode = Boolean(billId);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === selectedSupplierId),
    [selectedSupplierId, suppliers],
  );
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [selectedProductId, products],
  );

  useEffect(() => {
    if (selectedProduct) {
      setPurchasePrice(String(selectedProduct.purchasePrice));
      setSellingPrice(String(selectedProduct.sellingPrice));
    } else {
      setPurchasePrice("");
      setSellingPrice("");
    }
  }, [selectedProduct]);

  const supplierOptions = [
    { label: "Select Supplier", value: "" },
    ...suppliers.map((supplier) => ({
      label: supplier.supplierName,
      value: supplier.id,
    })),
  ];

  const productOptions = [
    { label: "Select Product", value: "" },
    ...products.map((product) => ({
      label: product.productName,
      value: product.id,
    })),
  ];

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supplierData, productData] = await Promise.all([
          getSuppliers(),
          getProducts(),
        ]);
        setSuppliers(supplierData);
        setProducts(productData);
      } catch (error) {
        showToast("Failed to load billing data", "error");
      }
    };
    loadData();
  }, [showToast]);

  useEffect(() => {
    const loadBill = async () => {
      if (!billId) return;
      try {
        const bill = await getSupplierBill(billId);
        if (!bill) {
          showToast("Supplier bill not found", "error");
          return;
        }

        const normalizedItems = bill.items.map((item) => {
          const purchasePrice = Number(item.purchasePrice ?? 0);
          const sellingPrice = Number(
            item.sellingPrice ?? item.purchasePrice ?? purchasePrice,
          );
          const quantity = Number(item.quantity ?? 0);
          const total = Number(
            item.total ?? Math.max(0, purchasePrice * quantity),
          );

          return {
            ...item,
            purchasePrice,
            sellingPrice,
            quantity,
            total,
            productName: item.productName ?? "Unknown Product",
          };
        });

        setSelectedSupplierId(bill.supplierId);
        setBillDate(new Date(bill.billDate));
        setNotes(bill.notes);
        setItems(normalizedItems);
        setOriginalItems(normalizedItems);
      } catch (error) {
        showToast("Failed to load supplier bill", "error");
      }
    };
    loadBill();
  }, [billId, showToast]);

  const addItem = () => {
    const product = selectedProduct;
    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePrice);
    const nextErrors: Record<string, string> = {};

    if (!selectedProductId) nextErrors.product = "Please select a product";
    if (isNaN(qty) || qty <= 0)
      nextErrors.quantity = "Qty must be > 0";
    const sellPrice = parseFloat(sellingPrice);
    if (isNaN(price) || price <= 0)
      nextErrors.purchasePrice = "Purchase price must be > 0";
    if (isNaN(sellPrice) || sellPrice <= 0)
      nextErrors.sellingPrice = "Sales price must be > 0";
    if (!product) nextErrors.product = "Please select a valid product";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!product) return;

    setErrors({});
    setItems((current) => {
      const existing = current.find(
        (item) => item.productId === selectedProductId,
      );
      if (existing) {
        const updatedItems = current.map((item) =>
          item.productId === selectedProductId
            ? {
                ...item,
                quantity: item.quantity + qty,
                purchasePrice: price,
                sellingPrice: sellPrice,
                total: (item.quantity + qty) * price,
              }
            : item,
        );
        return updatedItems;
      }

      return [
        ...current,
        {
          id: `${selectedProductId}-${Date.now()}`,
          productId: selectedProductId,
          productName: product.productName,
          quantity: qty,
          purchasePrice: price,
          sellingPrice: sellPrice,
          total: qty * price,
        },
      ];
    });

    setSelectedProductId("");
    setQuantity("");
    setPurchasePrice("");
    setSellingPrice("");
  };

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedSupplierId) nextErrors.supplierId = "Please select a supplier";
    if (items.length === 0)
      nextErrors.items = "Add at least one product to bill";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!selectedSupplier) return;
    setLoading(true);

    try {
      if (billId) {
        const updatedTotalAmount = items.reduce(
          (sum, item) => sum + item.total,
          0,
        );
        await updateSupplierBillData(billId, {
          items,
          notes: notes.trim(),
          billDate: toISOString(billDate),
          totalAmount: updatedTotalAmount,
        });
      } else {
        await createOrUpdateSupplierBill(
          selectedSupplierId,
          selectedSupplier.supplierName,
          items,
          toISOString(billDate),
          notes.trim(),
        );
      }

      const stockDeltas = new Map<string, number>();
      if (billId) {
        const originalMap = new Map(
          originalItems.map((item) => [item.productId, item.quantity]),
        );

        items.forEach((item) => {
          const originalQty = originalMap.get(item.productId) ?? 0;
          stockDeltas.set(item.productId, item.quantity - originalQty);
        });

        originalItems.forEach((original) => {
          if (!items.find((item) => item.productId === original.productId)) {
            stockDeltas.set(
              original.productId,
              (stockDeltas.get(original.productId) ?? 0) - original.quantity,
            );
          }
        });
      } else {
        items.forEach((item) => {
          stockDeltas.set(item.productId, item.quantity);
        });
      }

      for (const [productId, delta] of stockDeltas) {
        if (delta === 0) continue;
        const product = products.find((product) => product.id === productId);
        if (!product) continue;

        const updatedItem = items.find((item) => item.productId === productId);
        await updateProduct(product.id, {
          stockQuantity: product.stockQuantity + delta,
          ...(updatedItem ? { sellingPrice: updatedItem.sellingPrice } : {}),
        });
      }

      showToast(
        billId
          ? "Supplier bill updated and stock adjusted"
          : "Supplier bill saved and stock updated",
      );
      setItems([]);
      setNotes("");
      setBillDate(new Date());
      setSelectedSupplierId("");
      setSelectedProductId("");
    } catch (error) {
      showToast("Failed to save supplier bill", "error");
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Screen Header Banner */}
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>
          {isEditMode ? "Edit Purchase Invoice" : "New Purchase Invoice"}
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          {isEditMode
            ? "Modify details of the supplier bill and update inventory stock."
            : "Record items received from supplier and update stock automatically."}
        </Text>
      </View>

      {/* Invoice Details Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📄</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Invoice Metadata</Text>
        </View>

        {isEditMode ? (
          <View
            style={[
              styles.disabledContainer,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.disabledLabel, { color: colors.textSecondary }]}>
              Supplier
            </Text>
            <Text style={[styles.disabledValue, { color: colors.text }]}>
              {selectedSupplier?.supplierName || "Supplier Info Locked"}
            </Text>
            <Text style={[styles.disabledHint, { color: colors.textMuted }]}>
              Supplier cannot be changed in edit mode
            </Text>
          </View>
        ) : (
          <Dropdown
            label="Supplier"
            options={supplierOptions}
            value={selectedSupplierId}
            onChange={setSelectedSupplierId}
          />
        )}
        {errors.supplierId ? (
          <Text style={[styles.errorText, { color: colors.error, marginBottom: 12 }]}>
            {errors.supplierId}
          </Text>
        ) : null}

        {/* Date Row with period option */}
        <View style={styles.row}>
          <View style={styles.col}>
            <DatePickerField
              label="Bill Date"
              value={billDate}
              onChange={setBillDate}
            />
          </View>
          <View style={{ width: 120 }}>
            <Dropdown
              label="Period"
              options={[{ label: "Today", value: "today" }]}
              value="today"
              onChange={() => {}}
            />
          </View>
        </View>
      </View>

      {/* Add Products Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🛍️</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Add Product</Text>
        </View>

        <Dropdown
          label="Select Product"
          options={productOptions}
          value={selectedProductId}
          onChange={setSelectedProductId}
        />
        {errors.product ? (
          <Text style={[styles.errorText, { color: colors.error, marginBottom: 12 }]}>
            {errors.product}
          </Text>
        ) : null}

        {selectedProduct && (
          <View style={[styles.stockBadge, { backgroundColor: colors.infoLight }]}>
            <Text style={[styles.stockText, { color: colors.info }]}>
              📦 Stock Available: {selectedProduct.stockQuantity} units
            </Text>
          </View>
        )}

        {/* 3-Column Numeric Inputs Grid */}
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            <CustomInput
              label="Qty"
              placeholder="0"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              error={errors.quantity}
            />
          </View>
          <View style={styles.gridColLarge}>
            <CustomInput
              label="Buy (₹)"
              placeholder="0.00"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="decimal-pad"
              error={errors.purchasePrice}
            />
          </View>
          <View style={styles.gridColLarge}>
            <CustomInput
              label="Sell (₹)"
              placeholder="0.00"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="decimal-pad"
              error={errors.sellingPrice}
            />
          </View>
        </View>

        <CustomButton
          title="Add Product to Bill"
          onPress={addItem}
          variant="secondary"
          style={styles.addProductBtn}
        />
      </View>

      {/* Bill Items Receipt Card */}
      {items.length > 0 ? (
        <View
          style={[
            styles.receiptCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.receiptHeader}>
            <Text style={[styles.receiptTitle, { color: colors.textSecondary }]}>
              🧾 Invoice Items ({items.length})
            </Text>
          </View>

          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.receiptItemRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.productName}
                </Text>
                <View style={styles.itemSubrow}>
                  <Text style={[styles.itemQtyPrice, { color: colors.textSecondary }]}>
                    {item.quantity} × ₹{item.purchasePrice.toFixed(2)}
                  </Text>
                  <View style={[styles.sellBadge, { backgroundColor: colors.secondaryLight }]}>
                    <Text style={[styles.sellBadgeText, { color: colors.secondary }]}>
                      Sell: ₹{item.sellingPrice.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.itemRightAction}>
                <Text style={[styles.itemTotalAmount, { color: colors.text }]}>
                  ₹{item.total.toFixed(2)}
                </Text>
                <Pressable
                  onPress={() => removeItem(item.id)}
                  style={({ pressed }) => [
                    styles.itemDeleteBtn,
                    { backgroundColor: colors.errorLight },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={{ color: colors.error, fontSize: 13, fontWeight: "700" }}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

          {/* Receipt Dashed Total Summary */}
          <View style={[styles.receiptTotalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.receiptTotalLabel, { color: colors.textSecondary }]}>
              Total Amount
            </Text>
            <Text style={[styles.receiptTotalValue, { color: colors.primary }]}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      ) : (
        <EmptyState
          title="No Items Added Yet"
          message="Select products, enter quantities and purchase price to populate this bill invoice."
          icon="🧾"
        />
      )}

      {/* Notes Section Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Memo / Reference Notes</Text>
        </View>
        <CustomInput
          placeholder="Enter payment terms, reference numbers or purchase conditions..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />
      </View>

      {/* Main Save / Navigation Controls */}
      <View style={styles.actionSection}>
        {errors.items ? (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: colors.errorLight, borderColor: colors.error },
            ]}
          >
            <Text style={[styles.errorText, { color: colors.error }]}>
              ⚠️ {errors.items}
            </Text>
          </View>
        ) : null}

        <CustomButton
          title={isEditMode ? "💾 Update Purchase Invoice" : "💾 Save Purchase Invoice"}
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
        <CustomButton
          title="Back to Supplier Reports"
          onPress={() => navigation.navigate("SupplierReports" as never)}
          variant="secondary"
          style={styles.backBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  screenHeader: {
    marginBottom: 20,
    marginTop: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  disabledContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  disabledLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  disabledValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  disabledHint: {
    fontSize: 11,
    marginTop: 4,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  gridCol: {
    flex: 1,
  },
  gridColLarge: {
    flex: 1.25,
  },
  addProductBtn: {
    marginTop: 4,
  },
  receiptCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  receiptHeader: {
    paddingBottom: 10,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  receiptItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  itemSubrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemQtyPrice: {
    fontSize: 12,
  },
  sellBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sellBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  itemRightAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTotalAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
  itemDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  actionSection: {
    marginTop: 8,
    gap: 12,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  saveBtn: {
    paddingVertical: 15,
  },
  backBtn: {
    paddingVertical: 14,
  },
});
