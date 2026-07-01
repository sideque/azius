import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  EmptyState,
  LoadingSkeleton,
  useToast,
} from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import {
  createSupplierPayment,
  getSupplierPayments,
  getSuppliers,
} from "../../services/database";
import {
  PaymentMethod,
  Supplier,
  SupplierPaymentWithSupplier,
} from "../../types";
import {
  formatCurrency,
  formatDateTime,
  toISOString,
} from "../../utils/formatters";
import { validatePayment } from "../../utils/validation";
import { AdminDrawerParamList } from "../../navigation/types";

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Bank Transfer", value: "Bank Transfer" },
];

export function SupplierPaymentsScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<SupplierPaymentWithSupplier[]>([]);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierId),
    [supplierId, suppliers],
  );

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        showToast("Failed to load suppliers", "error");
      }
    };
    loadSuppliers();
  }, [showToast]);

  useEffect(() => {
    if (!supplierId) {
      setPayments([]);
      return;
    }

    const loadPayments = async () => {
      try {
        const data = await getSupplierPayments(supplierId);
        setPayments(data);
      } catch (error) {
        showToast("Failed to load payments", "error");
      }
    };
    loadPayments();
  }, [supplierId, showToast]);

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
    if (!validation.isValid) return;
    if (!selectedSupplier) return;

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
      setAmount("");
      setNotes("");
      const data = await getSupplierPayments(supplierId);
      setPayments(data);
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
            style={{ color: colors.warning, fontSize: 24, fontWeight: "700" }}
          >
            {formatCurrency(selectedSupplier.outstandingBalance ?? 0)}
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recent Payments
      </Text>
      {!supplierId ? (
        <EmptyState
          title="No Supplier Selected"
          message="Select a supplier to view payment history."
          icon="💳"
        />
      ) : payments.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No payments yet.
        </Text>
      ) : (
        payments.map((payment) => (
          <View
            key={payment.id}
            style={[
              styles.paymentRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {payment.receiptNumber}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {formatDateTime(payment.paymentDate)}
            </Text>
            <Text style={{ color: colors.success }}>
              {formatCurrency(payment.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: { textAlign: "center", marginVertical: 20 },
  paymentRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});
