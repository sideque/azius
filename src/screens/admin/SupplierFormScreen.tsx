import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CustomButton, CustomInput, useToast } from "../../components";
import {
  createSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
} from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import {
  addSupplier,
  editSupplier,
} from "../../store/slices/supplierSlice";
import { useTheme } from "../../theme/ThemeContext";
import { validateSupplier } from "../../utils/validation";
import { AdminDrawerParamList } from "../../navigation/types";

export function SupplierFormScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<AdminDrawerParamList, "SupplierForm">>();
  const supplierId = route.params?.supplierId;
  const isEdit = !!supplierId;

  const emptyForm = {
    supplierName: "",
    contactName: "",
    phoneNumber: "",
    address: "",
    notes: "",
    openingBalance: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplierId) {
      getSupplierById(supplierId).then((supplier) => {
        if (supplier)
          setForm({
            supplierName: supplier.supplierName,
            contactName: supplier.contactName,
            phoneNumber: supplier.phoneNumber,
            address: supplier.address,
            notes: supplier.notes,
            openingBalance: String(supplier.outstandingBalance ?? ""),
          });
      });
    } else {
      setForm(emptyForm);
      setErrors({});
    }
  }, [supplierId]);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const validation = validateSupplier(form);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    setLoading(true);
    const suppliers = await getSuppliers();

    const duplicate = suppliers.find(
      (supplier) =>
        supplier.supplierName.trim().toLowerCase() ===
          form.supplierName.trim().toLowerCase() &&
        (!isEdit || supplier.id !== supplierId),
    );

    if (duplicate) {
      setErrors((prev) => ({
        ...prev,
        supplierName: "Supplier already exists",
      }));
      showToast("Supplier already exists", "error");
      setLoading(false);
      return;
    }
    const startingBalance = parseFloat(form.openingBalance) || 0;
    const data = {
      supplierName: form.supplierName.trim(),
      contactName: form.contactName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      outstandingBalance: startingBalance,
      openingBalance: startingBalance,
    };

    try {
      if (isEdit && supplierId) {
        await dispatch(editSupplier({ id: supplierId, supplier: data }));
        showToast("Supplier updated");
      } else {
        await dispatch(addSupplier(data));
        showToast("Supplier created");
      }
      //   navigation.goBack();
      navigation.navigate("Suppliers" as never);
      setForm(emptyForm);
    } catch {
      showToast("Failed to save supplier", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <CustomInput
          label="Supplier Name"
          value={form.supplierName}
          onChangeText={(v) => update("supplierName", v)}
          error={errors.supplierName}
        />
        <View style={styles.row}>
          <View style={styles.col}>
            <CustomInput
              label="Contact Name"
              value={form.contactName}
              onChangeText={(v) => update("contactName", v)}
            />
          </View>
          <View style={styles.col}>
            <CustomInput
              label="Phone Number"
              value={form.phoneNumber}
              onChangeText={(v) => update("phoneNumber", v)}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />
          </View>
        </View>
        <CustomInput
          label="Address"
          value={form.address}
          onChangeText={(v) => update("address", v)}
        />
        <CustomInput
          label="Opening Balance"
          value={form.openingBalance}
          onChangeText={(v) => update("openingBalance", v)}
          keyboardType="decimal-pad"
          error={errors.openingBalance}
        />
        <CustomInput
          label="Notes"
          value={form.notes}
          onChangeText={(v) => update("notes", v)}
          multiline
          numberOfLines={3}
        />
        <CustomButton
          title={isEdit ? "Update Supplier" : "Create Supplier"}
          onPress={handleSave}
          loading={loading}
        />
        <CustomButton
          title="Back to Suppliers"
          onPress={() => navigation.navigate("Suppliers" as never)}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
});
