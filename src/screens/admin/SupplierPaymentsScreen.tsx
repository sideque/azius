import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  useToast,
} from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import {
  createSupplierPayment,
  deleteSupplierPayment,
  getSupplierPayments,
  getSuppliers,
  updateSupplierPaymentData,
} from "../../services/database";
import { PaymentMethod, Supplier, SupplierPaymentWithSupplier } from "../../types";
import { formatCurrency, toISOString } from "../../utils/formatters";
import { validatePayment } from "../../utils/validation";
import { AdminDrawerParamList } from "../../navigation/types";

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Bank Transfer", value: "Bank Transfer" },
];

export function SupplierPaymentsScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const route = useRoute<any>();
  const editPaymentId = route.params?.paymentId as string | undefined;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierId),
    [supplierId, suppliers],
  );

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      return data;
    } catch {
      showToast("Failed to load suppliers", "error");
      return [];
    }
  };

  // Load existing payment data when paymentId is provided (edit mode)
  const loadPaymentForEdit = async (paymentId: string) => {
    try {
      setLoading(true);
      const suppliersList = await loadSuppliers();

      // Search through each supplier's payments to find the one we need
      for (const supplier of suppliersList) {
        const payments = await getSupplierPayments(supplier.id);
        const payment = payments.find((p) => p.id === paymentId);
        if (payment) {
          setSupplierId(payment.supplierId);
          setAmount(String(payment.amount));
          setMethod(payment.paymentMethod);
          setNotes(payment.notes || "");
          setPaymentDate(new Date(payment.paymentDate));
          setIsEditMode(true);
          setEditingPaymentId(paymentId);
          return;
        }
      }
      showToast("Payment not found", "error");
    } catch {
      showToast("Failed to load payment details", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplierId("");
    setAmount("");
    setNotes("");
    setPaymentDate(new Date());
    setMethod("Cash");
    setIsEditMode(false);
    setEditingPaymentId(null);
    setErrors({});
  };

  useFocusEffect(
    useCallback(() => {
      if (editPaymentId) {
        loadPaymentForEdit(editPaymentId);
        // Clear the param so re-focusing from the sidebar doesn't re-trigger edit mode
        navigation.setParams({ paymentId: undefined } as any);
      } else {
        // Fresh visit — reset everything to the default "create" form
        resetForm();
        loadSuppliers();
      }

      return () => {
        // When leaving the screen, reset form so it's clean on next visit
        resetForm();
      };
    }, [editPaymentId]),
  );

  const supplierOptions = [
    { label: "Select Supplier", value: "" },
    ...suppliers.map((supplier) => ({
      label: supplier.supplierName,
      value: supplier.id,
    })),
  ];


  const handleSave = async () => {
    const validation = validatePayment(amount, supplierId);
    setErrors(validation.errors);

    if (!validation.isValid || !selectedSupplier) return;

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }

    setSaving(true);

    try {
      if (isEditMode && editingPaymentId) {
        // Update existing payment
        await updateSupplierPaymentData(editingPaymentId, {
          amount: paymentAmount,
          paymentMethod: method,
          paymentDate: toISOString(paymentDate),
          notes,
        });
        showToast("Supplier payment updated");
        navigation.navigate("SupplierReports");
      } else {
        // Create new payment
        await createSupplierPayment(
          supplierId,
          selectedSupplier.supplierName,
          paymentAmount,
          method,
          notes,
          toISOString(paymentDate),
        );
        showToast("Supplier payment recorded");
        await loadSuppliers();
        resetForm();
      }
    } catch (error: any) {
      showToast(error?.message ?? "Could not save payment", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingPaymentId) return;

    Alert.alert(
      "Delete Supplier Payment",
      "Are you sure you want to delete this payment? This will update the supplier outstanding balance.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSupplierPayment(editingPaymentId);
              showToast("Supplier payment deleted");
              navigation.navigate("SupplierReports");
            } catch (error: any) {
              showToast(
                error?.message ?? "Failed to delete payment",
                "error",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
        <Dropdown
          label="Supplier"
          options={supplierOptions}
          value={supplierId}
          onChange={setSupplierId}
        />

        {selectedSupplier && (
          <View
            style={[styles.balanceCard, { backgroundColor: colors.warningLight }]}
          >
            <Text style={{ color: colors.textSecondary }}>
              Outstanding Balance
            </Text>

            <Text
              style={{
                color: colors.warning,
                fontSize: 24,
                fontWeight: "700",
              }}
            >
              {formatCurrency(selectedSupplier.outstandingBalance ?? 0)}
            </Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.col}>
            <CustomInput
              label="Payment Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={errors.amount}
            />
          </View>
          <View style={styles.col}>
            <Dropdown
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={method}
              onChange={(value) => setMethod(value as PaymentMethod)}
            />
          </View>
        </View>

        <DatePickerField
          label="Payment Date"
          value={paymentDate}
          onChange={setPaymentDate}
        />

        <CustomInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <CustomButton
          title={isEditMode ? "Update Payment" : "Save Payment"}
          onPress={handleSave}
          loading={saving}
          disabled={deleting}
        />

        {isEditMode && (
          <CustomButton
            title="Delete Payment"
            onPress={handleDelete}
            variant="danger"
            style={{ marginTop: 12 }}
            loading={deleting}
            disabled={saving}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  balanceCard: {
    padding: 16,
    borderRadius: 14,
    marginVertical: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});
