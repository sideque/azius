import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
  const [originalSupplier, setOriginalSupplier] = useState<any>(null);
  // loadingSupplier = true while fetching fresh data from Firestore
  const [loadingSupplier, setLoadingSupplier] = useState(isEdit);

  useEffect(() => {
    if (supplierId) {
      let cancelled = false;
      // Always fetch fresh data from Firestore on edit
      setLoadingSupplier(true);
      getSupplierById(supplierId)
        .then((supplier) => {
          if (cancelled) return;
          if (supplier) {
            setOriginalSupplier(supplier);
            setForm({
              supplierName: supplier.supplierName,
              contactName: supplier.contactName,
              phoneNumber: supplier.phoneNumber,
              address: supplier.address,
              notes: supplier.notes,
              openingBalance: String(supplier.openingBalance ?? ""),
            });
          } else {
            showToast("Supplier not found", "error");
          }
        })
        .catch(() => {
          if (!cancelled) showToast("Failed to load supplier details", "error");
        })
        .finally(() => {
          if (!cancelled) setLoadingSupplier(false);
        });
      return () => {
        cancelled = true;
      };
    }
    // Creating new supplier — reset form
    setForm(emptyForm);
    setOriginalSupplier(null);
    setErrors({});
    setLoadingSupplier(false);
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
    try {
      if (isEdit && supplierId && originalSupplier) {
        const newOpeningBalance = parseFloat(form.openingBalance) || 0;
        const oldOpeningBalance = originalSupplier.openingBalance ?? 0;
        const oldOutstandingBalance = originalSupplier.outstandingBalance ?? 0;

        const updateData: any = {
          supplierName: form.supplierName.trim(),
          contactName: form.contactName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        };

        if (newOpeningBalance !== oldOpeningBalance) {
          const diff = newOpeningBalance - oldOpeningBalance;
          updateData.openingBalance = newOpeningBalance;
          updateData.outstandingBalance = oldOutstandingBalance + diff;
        }

        await dispatch(editSupplier({ id: supplierId, supplier: updateData }));
        showToast("Supplier updated");
      } else {
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

  // Show full-screen loader while fetching supplier data from Firestore
  if (isEdit && loadingSupplier) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading supplier details...
        </Text>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: "500" },
});
