import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import {
  CustomButton,
  CustomInput,
  Dropdown,
  useToast,
} from "../../components";
import { getProductById, getProducts } from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import {
  addProduct,
  editProduct,
  removeProduct,
} from "../../store/slices/productSlice";
import { useTheme } from "../../theme/ThemeContext";
import { validateProduct } from "../../utils/validation";
import { AdminDrawerParamList } from "../../navigation/types";

export function ProductFormScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<AdminDrawerParamList, "ProductForm">>();
  const productId = route.params?.productId;
  const isEdit = !!productId;

  const [form, setForm] = useState({
    productName: "",
    productCode: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stockQuantity: "",
    unit: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [unitOptions, setUnitOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    const emptyForm = {
      productName: "",
      productCode: "",
      category: "",
      purchasePrice: "",
      sellingPrice: "",
      stockQuantity: "",
      unit: "",
      description: "",
    };

    setForm(emptyForm);
    setErrors({});

    const loadUnits = async () => {
      try {
        const products = await getProducts();
        const defaultUnits = [
          "kg",
          "pack",
          "piece",
          "box",
          "bottle",
          "bag",
          "liter",
          "gm",
          "ml",
        ];
        const units = Array.from(
          new Set([
            ...defaultUnits,
            ...products
              .map((product) => product.unit)
              .filter((unit): unit is string => Boolean(unit)),
          ]),
        );
        const options = units.map((unit) => ({ label: unit, value: unit }));
        setUnitOptions(options);
      } catch (error) {
        console.warn("Failed to load product units", error);
        setUnitOptions([]);
      }
    };

    loadUnits();
    if (productId) {
      getProductById(productId).then((p) => {
        if (p)
          setForm({
            productName: p.productName,
            productCode: p.productCode,
            category: p.category,
            purchasePrice: String(p.purchasePrice),
            sellingPrice: String(p.sellingPrice),
            stockQuantity: String(p.stockQuantity),
            unit: p.unit,
            description: p.description,
          });
      });
    }
  }, [productId]);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const validation = validateProduct(form, false);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    setLoading(true);
    const existingProducts = await getProducts();

    const duplicateName = existingProducts.find(
      (p) =>
        p.productName.trim().toLowerCase() ===
          form.productName.trim().toLowerCase() &&
        (!isEdit || p.id !== productId),
    );

    if (duplicateName) {
      setErrors((prev) => ({
        ...prev,
        productName: "Product name already exists",
      }));
      showToast("Product name already exists", "error");
      setLoading(false);
      return;
    }

    const duplicateCode = existingProducts.find(
      (p) =>
        p.productCode.trim().toLowerCase() ===
          form.productCode.trim().toLowerCase() &&
        (!isEdit || p.id !== productId),
    );

    if (duplicateCode) {
      setErrors((prev) => ({
        ...prev,
        productCode: "Product code already exists",
      }));
      showToast("Product code already exists", "error");
      setLoading(false);
      return;
    }
    const data = {
      productName: form.productName.trim(),
      productCode: form.productCode.trim(),
      category: form.category.trim(),
      purchasePrice: parseFloat(form.purchasePrice),
      sellingPrice: parseFloat(form.sellingPrice),
      stockQuantity: parseFloat(form.stockQuantity),
      unit: form.unit.trim(),
      description: form.description.trim(),
    };

    try {
      if (isEdit && productId) {
        await dispatch(editProduct({ id: productId, product: data }));
        showToast("Product updated");
      } else {
        await dispatch(addProduct(data)).unwrap();
        showToast("Product created");
      }
      navigation.navigate("Products" as never);
      setForm({
    productName: "",
    productCode: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stockQuantity: "",
    unit: "",
    description: "",
  })
    } catch (error) {
      showToast("Failed to save product", "error");
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (productId) {
      await dispatch(removeProduct(productId));
      showToast("Product deleted");
      navigation.navigate("Products" as never);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <CustomInput
        label="Product Name"
        value={form.productName}
        onChangeText={(v) => update("productName", v)}
        error={errors.productName}
      />
      <CustomInput
        label="Product Code"
        value={form.productCode}
        onChangeText={(v) => update("productCode", v)}
        error={errors.productCode}
      />
      <CustomInput
        label="Purchase Price"
        value={form.purchasePrice}
        onChangeText={(v) => update("purchasePrice", v)}
        keyboardType="decimal-pad"
        error={errors.purchasePrice}
      />
      <CustomInput
        label="Selling Price"
        value={form.sellingPrice}
        onChangeText={(v) => update("sellingPrice", v)}
        keyboardType="decimal-pad"
        error={errors.sellingPrice}
      />
      <CustomInput
        label="Opening Quantity"
        value={form.stockQuantity}
        onChangeText={(v) => update("stockQuantity", v)}
        keyboardType="decimal-pad"
        error={errors.stockQuantity}
      />
      <Dropdown
        label="Unit"
        options={unitOptions}
        value={form.unit}
        onChange={(value) => update("unit", value)}
        placeholder="Select unit"
      />

      <CustomInput
        label="Description"
        value={form.description}
        onChangeText={(v) => update("description", v)}
        multiline
        numberOfLines={3}
      />
      <CustomButton
        title={isEdit ? "Update Product" : "Create Product"}
        onPress={handleSave}
        loading={loading}
      />
      {isEdit && (
        <CustomButton
          title="Delete Product"
          onPress={handleDelete}
          variant="danger"
          style={{ marginTop: 12 }}
        />
      )}
      <CustomButton
        title="Back to Products"
        onPress={() => navigation.navigate("Products" as never)}
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  errorText: { marginTop: -10, marginBottom: 16, fontSize: 12 },
});
