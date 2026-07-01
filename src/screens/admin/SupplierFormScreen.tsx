import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CustomButton, CustomInput, useToast } from "../../components";
import {
  createSupplier,
  getSupplierById,
  updateSupplier,
} from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import {
  addSupplier,
  editSupplier,
  removeSupplier,
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

  const [form, setForm] = useState({
    supplierName: "",
    contactName: "",
    phoneNumber: "",
    address: "",
    notes: "",
    openingBalance: "",
  });
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
    }
  }, [supplierId]);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const validation = validateSupplier(form);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    setLoading(true);
    const data = {
      supplierName: form.supplierName.trim(),
      contactName: form.contactName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      outstandingBalance: parseFloat(form.openingBalance) || 0,
    };

    try {
      if (isEdit && supplierId) {
        await dispatch(editSupplier({ id: supplierId, supplier: data }));
        showToast("Supplier updated");
      } else {
        await dispatch(addSupplier(data));
        showToast("Supplier created");
      }
      navigation.goBack();
    } catch {
      showToast("Failed to save supplier", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (supplierId) {
      await dispatch(removeSupplier(supplierId));
      showToast("Supplier deleted");
      navigation.goBack();
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <CustomInput
        label="Supplier Name"
        value={form.supplierName}
        onChangeText={(v) => update("supplierName", v)}
        error={errors.supplierName}
      />
      <CustomInput
        label="Contact Name"
        value={form.contactName}
        onChangeText={(v) => update("contactName", v)}
      />
      <CustomInput
        label="Phone Number"
        value={form.phoneNumber}
        onChangeText={(v) => update("phoneNumber", v)}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />
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
        title="Back to Suppliers"
        onPress={() => navigation.navigate("Suppliers" as never)}
        variant="secondary"
        style={{ marginBottom: 12 }}
      />
      <CustomButton
        title={isEdit ? "Update Supplier" : "Create Supplier"}
        onPress={handleSave}
        loading={loading}
      />
      {isEdit && (
        <CustomButton
          title="Delete Supplier"
          onPress={handleDelete}
          variant="danger"
          style={{ marginTop: 12 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
