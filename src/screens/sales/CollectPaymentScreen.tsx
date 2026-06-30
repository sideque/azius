import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  CustomButton, CustomInput, DatePickerField, Dropdown,
  Modal, PaymentCard, useToast,
} from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchShops } from '../../store/slices/shopSlice';
import { collectPayment, clearLastPayment } from '../../store/slices/paymentSlice';
import { useTheme } from '../../theme/ThemeContext';
import { validatePayment } from '../../utils/validation';
import { formatCurrency, formatDateTime, toISOString } from '../../utils/formatters';
import { PaymentMethod } from '../../types';

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'Cash' },
  { label: 'UPI', value: 'UPI' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
];

export function CollectPaymentScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const shops = useAppSelector((s) => s.shops.items);
  const { loading, lastPayment } = useAppSelector((s) => s.payments);

  const [shopId, setShopId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReceipt, setShowReceipt] = useState(false);

  const load = useCallback(() => dispatch(fetchShops()), [dispatch]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shopOptions = shops.map((s) => ({
    label: `${s.shopName} (Bal: ${formatCurrency(s.outstandingBalance)})`,
    value: s.id,
  }));

  const selectedShop = shops.find((s) => s.id === shopId);

  const handleSave = async () => {
    const validation = validatePayment(amount, shopId);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    const payAmount = parseFloat(amount);
    if (selectedShop && payAmount > selectedShop.outstandingBalance) {
      showToast('Amount exceeds outstanding balance', 'error');
      return;
    }

    const result = await dispatch(collectPayment({
      shopId,
      amount: payAmount,
      paymentMethod: method,
      notes,
      paymentDate: toISOString(paymentDate),
    }));

    if (collectPayment.fulfilled.match(result)) {
      showToast('Payment collected!');
      setShowReceipt(true);
      setAmount('');
      setNotes('');
      dispatch(fetchShops());
    } else {
      showToast(result.payload as string ?? 'Failed', 'error');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <Dropdown label="Select Shop" options={shopOptions} value={shopId} onChange={setShopId} placeholder="Choose a shop..." />
      {selectedShop && (
        <View style={[styles.balanceCard, { backgroundColor: colors.warningLight }]}>
          <Text style={{ color: colors.textSecondary }}>Outstanding Balance</Text>
          <Text style={{ color: colors.warning, fontSize: 24, fontWeight: '700' }}>{formatCurrency(selectedShop.outstandingBalance)}</Text>
        </View>
      )}
      <CustomInput label="Payment Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={errors.amount} />
      <Dropdown
        label="Payment Method"
        options={PAYMENT_METHODS}
        value={method}
        onChange={(v) => setMethod(v as PaymentMethod)}
      />
      <DatePickerField label="Payment Date" value={paymentDate} onChange={setPaymentDate} />
      <CustomInput label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
      <CustomButton title="Save Payment" onPress={handleSave} loading={loading} />

      <Modal visible={showReceipt} title="Payment Receipt" onClose={() => { setShowReceipt(false); dispatch(clearLastPayment()); }}>
        {lastPayment && (
          <View style={[styles.receipt, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.receiptTitle, { color: colors.success }]}>Payment Received</Text>
            <Text style={{ color: colors.textMuted }}>{lastPayment.receiptNumber}</Text>
            <View style={styles.divider} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{lastPayment.shopName}</Text>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800', marginVertical: 12 }}>{formatCurrency(lastPayment.amount)}</Text>
            <Text style={{ color: colors.textSecondary }}>{lastPayment.paymentMethod}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{formatDateTime(lastPayment.paymentDate)}</Text>
            {lastPayment.notes ? <Text style={{ color: colors.textMuted, marginTop: 8 }}>{lastPayment.notes}</Text> : null}
          </View>
        )}
        <CustomButton title="Close" onPress={() => { setShowReceipt(false); dispatch(clearLastPayment()); }} style={{ marginTop: 16 }} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  balanceCard: { padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  receipt: { padding: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  receiptTitle: { fontSize: 20, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E2E8F0', width: '100%', marginVertical: 12 },
});
