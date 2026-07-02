import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  useToast,
} from "../../components";
import { useAppDispatch } from "../../store/hooks";
import { updatePayment } from "../../store/slices/paymentSlice";
import { useTheme } from "../../theme/ThemeContext";
import { PaymentMethod, Payment } from "../../types";
import * as db from "../../services/database";
import { toISOString } from "../../utils/formatters";

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Bank Transfer", value: "Bank Transfer" },
];

export function EditPaymentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const paymentId = route.params?.paymentId;
  const receiptNumber = route.params?.receiptNumber;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<
    (Payment & { shopName: string }) | null
  >(null);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date());

  useEffect(() => {
    if (!paymentId) {
      navigation.goBack();
      return;
    }
    const loadPayment = async () => {
      try {
        const details = await db.getPaymentByReceiptNumber(receiptNumber);
        if (details) {
          setPayment(details);
          setAmount(details.amount.toString());
          setMethod(details.paymentMethod);
          setNotes(details.notes || "");
          setPaymentDate(new Date(details.paymentDate));
        } else {
          showToast("Payment not found", "error");
          navigation.goBack();
        }
      } catch (e) {
        showToast("Failed to load payment", "error");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadPayment();
  }, [paymentId, receiptNumber]);

  const handleSave = async () => {
    if (!payment) return;
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }

    setSaving(true);
    const result = await dispatch(
      updatePayment({
        id: paymentId,
        data: {
          amount: payAmount,
          paymentMethod: method,
          notes,
          paymentDate: toISOString(paymentDate),
        },
      }),
    );
    setSaving(false);

    if (updatePayment.fulfilled.match(result)) {
      showToast("Payment updated successfully");
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      {payment && (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: colors.textSecondary }}>Shop</Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
            {payment.shopName}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            Receipt Number
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {payment.receiptNumber}
          </Text>
        </View>
      )}
      <CustomInput
        label="Payment Amount (₹)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Dropdown
        label="Payment Method"
        options={PAYMENT_METHODS}
        value={method}
        onChange={(v) => setMethod(v as PaymentMethod)}
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
        title="Update Payment"
        onPress={handleSave}
        loading={saving}
      />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});
