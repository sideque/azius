import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SaleWithDetails } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useTheme } from '../theme/ThemeContext';

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  invoice: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12 },
  shop: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  divider: { height: 1, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { flex: 1, fontSize: 14 },
  grand: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  amount: { fontSize: 16, fontWeight: '700' },
  type: { fontSize: 14, fontWeight: '700' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 10 },
  cell: { width: 120, paddingHorizontal: 8, fontSize: 13 },
  headerCell: { fontWeight: '700' },
});

export function InvoiceCard({ sale }: { sale: SaleWithDetails }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.invoice, { color: colors.primary }]}>{sale.invoiceNumber}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDateTime(sale.createdAt)}</Text>
      </View>
      <Text style={[styles.shop, { color: colors.text }]}>{sale.shopName}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      {sale.items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={[styles.itemName, { color: colors.text }]}>{item.productName} x{item.quantity}</Text>
          <Text style={{ color: colors.text }}>{formatCurrency(item.total)}</Text>
        </View>
      ))}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.row}><Text style={{ color: colors.textSecondary }}>Subtotal</Text><Text style={{ color: colors.text }}>{formatCurrency(sale.subtotal)}</Text></View>
      {sale.discount > 0 && <View style={styles.row}><Text style={{ color: colors.textSecondary }}>Discount</Text><Text style={{ color: colors.error }}>-{formatCurrency(sale.discount)}</Text></View>}
      <View style={styles.row}><Text style={[styles.grand, { color: colors.text }]}>Grand Total</Text><Text style={[styles.grand, { color: colors.primary }]}>{formatCurrency(sale.grandTotal)}</Text></View>
    </View>
  );
}

export function PaymentCard({ payment }: { payment: { shopName: string; amount: number; paymentMethod: string; paymentDate: string; notes?: string } }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.shop, { color: colors.text, marginTop: 0 }]}>{payment.shopName}</Text>
        <Text style={[styles.amount, { color: colors.success }]}>{formatCurrency(payment.amount)}</Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{payment.paymentMethod} • {formatDateTime(payment.paymentDate)}</Text>
      {payment.notes ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{payment.notes}</Text> : null}
    </View>
  );
}

export function LedgerCard({ entry }: { entry: { transactionType: string; referenceNumber: string; debit: number; credit: number; balance: number; createdAt: string } }) {
  const { colors } = useTheme();
  const isSale = entry.transactionType === 'sale';
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.type, { color: isSale ? colors.error : colors.success }]}>
            {isSale ? 'Sale (Debit)' : 'Payment (Credit)'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{entry.referenceNumber}</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDateTime(entry.createdAt)}</Text>
      </View>
      <View style={[styles.row, { marginTop: 8 }]}>
        <Text style={{ color: colors.text }}>{isSale ? `+${formatCurrency(entry.debit)}` : `-${formatCurrency(entry.credit)}`}</Text>
        <Text style={{ color: colors.text, fontWeight: '700' }}>Bal: {formatCurrency(entry.balance)}</Text>
      </View>
    </View>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal>
      <View>
        <View style={[styles.tableRow, { backgroundColor: colors.primaryLight }]}>
          {headers.map((h) => <Text key={h} style={[styles.cell, styles.headerCell, { color: colors.text }]}>{h}</Text>)}
        </View>
        {rows.map((row, i) => (
          <View key={i} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            {row.map((cell, j) => <Text key={j} style={[styles.cell, { color: colors.text }]}>{cell}</Text>)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
