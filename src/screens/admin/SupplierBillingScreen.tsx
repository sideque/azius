import React, { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
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
      nextErrors.quantity = "Quantity must be greater than zero";
    const sellPrice = parseFloat(sellingPrice);
    if (isNaN(price) || price <= 0)
      nextErrors.purchasePrice = "Purchase price must be greater than zero";
    if (isNaN(sellPrice) || sellPrice <= 0)
      nextErrors.sellingPrice = "Sales price must be greater than zero";
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
      keyboardShouldPersistTaps="handled"
    >
      <Dropdown
        label="Supplier"
        options={supplierOptions}
        value={selectedSupplierId}
        onChange={isEditMode ? () => {} : setSelectedSupplierId}
      />
      <Dropdown
        label="Product"
        options={productOptions}
        value={selectedProductId}
        onChange={setSelectedProductId}
      />
      {errors.product ? (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors.product}
        </Text>
      ) : null}
      <CustomInput
        label="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        error={errors.quantity}
      />
      <CustomInput
        label="Purchase Price"
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        keyboardType="decimal-pad"
        error={errors.purchasePrice}
      />
      <CustomInput
        label="Sales Price"
        value={sellingPrice}
        onChangeText={setSellingPrice}
        keyboardType="decimal-pad"
        error={errors.sellingPrice}
      />
      <CustomButton title="Add Item" onPress={addItem} />

      {items.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bill Items
          </Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.itemRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {item.productName}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {item.quantity} × {item.purchasePrice.toFixed(2)} ={" "}
                    {item.total.toFixed(2)}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    Sell: {item.sellingPrice.toFixed(2)}
                  </Text>
                </View>
                <CustomButton
                  title="Remove"
                  onPress={() => removeItem(item.id)}
                  variant="danger"
                  style={styles.removeBtn}
                />
              </View>
            )}
          />
        </View>
      ) : (
        <EmptyState
          title="No bill items"
          message="Add products to create a supplier bill."
          icon="🧾"
        />
      )}

      <Dropdown
        label="Bill Date"
        options={[{ label: "Today", value: "today" }]}
        value="today"
        onChange={() => {}}
      />
      <DatePickerField
        label="Bill Date"
        value={billDate}
        onChange={setBillDate}
      />
      <CustomInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      <Text style={[styles.totalText, { color: colors.text }]}>
        Total: {totalAmount.toFixed(2)}
      </Text>
      <CustomButton
        title={isEditMode ? "Update Supplier Bill" : "Save Supplier Bill"}
        onPress={handleSave}
        loading={loading}
      />
      <CustomButton
        title="Back to Supplier Reports"
        onPress={() => navigation.navigate("SupplierReports" as never)}
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemName: { fontSize: 15, fontWeight: "700" },
  removeBtn: { minWidth: 90, marginTop: 0 },
  errorText: { marginTop: 8, marginBottom: 8, fontSize: 12 },
  totalText: { marginTop: 16, fontSize: 18, fontWeight: "700" },
});
