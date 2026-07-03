import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  useToast,
} from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import { createSupplierPayment, getSuppliers } from "../../services/database";
import { PaymentMethod, Supplier } from "../../types";
import { formatCurrency, toISOString } from "../../utils/formatters";
import { validatePayment } from "../../utils/validation";
import { useRoute } from "@react-navigation/native";

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Bank Transfer", value: "Bank Transfer" },
];

export function SupplierPaymentsScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierId),
    [supplierId, suppliers],
  );
  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch {
      showToast("Failed to load suppliers", "error");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, []),
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

    setLoading(true);

    try {
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

      setAmount("");
      setNotes("");
      setPaymentDate(new Date());
    } catch (error: any) {
      showToast(error?.message ?? "Could not save payment", "error");
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
            {formatCurrency(
              (selectedSupplier.openingBalance ?? 0) +
                (selectedSupplier.outstandingBalance ?? 0),
            )}
          </Text>
        </View>
      )}

      <CustomInput
        label="Payment Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        error={errors.amount}
      />

      <Dropdown
        label="Payment Method"
        options={PAYMENT_METHODS}
        value={method}
        onChange={(value) => setMethod(value as PaymentMethod)}
      />

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
        title="Save Payment"
        onPress={handleSave}
        loading={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
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
