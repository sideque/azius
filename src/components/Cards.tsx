import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
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

export function InvoiceCard({ sale, onEdit, onDelete }: { sale: SaleWithDetails, onEdit?: () => void, onDelete?: () => void }) {
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
      {(onEdit || onDelete) && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
          {onEdit && (
            <Pressable onPress={onEdit} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '20', borderRadius: 6, marginRight: onDelete ? 8 : 0 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.error + '20', borderRadius: 6 }}>
              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function PaymentCard({ payment, onEdit, onDelete }: { payment: { shopName: string; amount: number; paymentMethod: string; paymentDate: string; notes?: string }, onEdit?: () => void, onDelete?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.shop, { color: colors.text, marginTop: 0 }]}>{payment.shopName}</Text>
        <Text style={[styles.amount, { color: colors.success }]}>{formatCurrency(payment.amount)}</Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{payment.paymentMethod} • {formatDateTime(payment.paymentDate)}</Text>
      {payment.notes ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{payment.notes}</Text> : null}
      {(onEdit || onDelete) && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
          {onEdit && (
            <Pressable onPress={onEdit} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '20', borderRadius: 6, marginRight: onDelete ? 8 : 0 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.error + '20', borderRadius: 6 }}>
              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function LedgerCard({ entry, onPress, onEdit, onDelete }: { entry: { transactionType: string; referenceNumber: string; debit: number; credit: number; balance: number; createdAt: string }, onPress?: () => void, onEdit?: () => void, onDelete?: () => void }) {
  const { colors } = useTheme();
  const isSale = entry.transactionType === 'sale';
  const CardContent = (
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
      {(onPress || onEdit || onDelete) && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
          {onPress && (
            <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '20', borderRadius: 6, marginRight: (onEdit || onDelete) ? 8 : 0 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>View Details</Text>
            </Pressable>
          )}
          {onEdit && (
            <Pressable onPress={onEdit} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '20', borderRadius: 6, marginRight: onDelete ? 8 : 0 }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.error + '20', borderRadius: 6 }}>
              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  return CardContent;
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
