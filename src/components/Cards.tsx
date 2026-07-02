import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SaleWithDetails, Supplier } from "../types";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import { useTheme } from "../theme/ThemeContext";

// ─── Shared action button ─────────────────────────────────────────────────────
function ActionBtn({
  label,
  onPress,
  color,
  bgColor,
}: {
  label: string;
  onPress: () => void;
  color: string;
  bgColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: bgColor },
        pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ─── InvoiceCard ─────────────────────────────────────────────────────────────
export function InvoiceCard({
  sale,
  onEdit,
  onDelete,
}: {
  sale: SaleWithDetails;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.invoiceBadge, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.invoiceNum, { color: colors.secondary }]}>
            {sale.invoiceNumber}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          {formatDateTime(sale.createdAt)}
        </Text>
      </View>

      <Text style={[styles.shopName, { color: colors.text }]}>{sale.shopName}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {sale.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={[styles.itemName, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.productName} × {item.quantity}
          </Text>
          <Text style={[styles.itemTotal, { color: colors.text }]}>
            {formatCurrency(item.total)}
          </Text>
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.totalRow}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Subtotal</Text>
        <Text style={{ color: colors.text, fontSize: 13 }}>{formatCurrency(sale.subtotal)}</Text>
      </View>
      {sale.discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Discount</Text>
          <Text style={{ color: colors.error, fontSize: 13 }}>-{formatCurrency(sale.discount)}</Text>
        </View>
      )}
      <View style={[styles.totalRow, styles.grandRow]}>
        <Text style={[styles.grandLabel, { color: colors.text }]}>Grand Total</Text>
        <Text style={[styles.grandValue, { color: colors.primary }]}>
          {formatCurrency(sale.grandTotal)}
        </Text>
      </View>

      {(onEdit || onDelete) && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {onEdit && (
            <ActionBtn label="Edit" onPress={onEdit} color={colors.secondary} bgColor={colors.secondaryLight} />
          )}
          {onDelete && (
            <ActionBtn label="Delete" onPress={onDelete} color={colors.error} bgColor={colors.errorLight} />
          )}
        </View>
      )}
    </View>
  );
}

// ─── PaymentCard ─────────────────────────────────────────────────────────────
export function PaymentCard({
  payment,
  onEdit,
  onDelete,
}: {
  payment: {
    shopName: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    notes?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.shopName, { color: colors.text, marginTop: 0 }]}>
            {payment.shopName}
          </Text>
          <View style={styles.methodRow}>
            <View style={[styles.methodBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.methodText, { color: colors.primary }]}>
                {payment.paymentMethod}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {formatDateTime(payment.paymentDate)}
            </Text>
          </View>
        </View>
        <Text style={[styles.paymentAmount, { color: colors.success }]}>
          +{formatCurrency(payment.amount)}
        </Text>
      </View>

      {payment.notes ? (
        <Text style={[styles.notes, { color: colors.textMuted, borderTopColor: colors.border }]}>
          {payment.notes}
        </Text>
      ) : null}

      {(onEdit || onDelete) && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {onEdit && (
            <ActionBtn label="Edit" onPress={onEdit} color={colors.secondary} bgColor={colors.secondaryLight} />
          )}
          {onDelete && (
            <ActionBtn label="Delete" onPress={onDelete} color={colors.error} bgColor={colors.errorLight} />
          )}
        </View>
      )}
    </View>
  );
}

// ─── SupplierCard ─────────────────────────────────────────────────────────────
export function SupplierCard({
  supplier,
  onPress,
}: {
  supplier: Supplier;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const initials = supplier.supplierName.substring(0, 2).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.supplierHeader}>
        <View style={[styles.supplierAvatar, { backgroundColor: colors.secondaryLight }]}>
          <Text style={[styles.supplierAvatarText, { color: colors.secondary }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.shopName, { color: colors.text, marginTop: 0 }]}>
            {supplier.supplierName}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {supplier.contactName}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
            {supplier.phoneNumber}
          </Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
      </View>

      {(supplier.address || supplier.notes) && (
        <View style={[styles.supplierFooter, { borderTopColor: colors.border }]}>
          {supplier.address ? (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>📍 {supplier.address}</Text>
          ) : null}
          {supplier.notes ? (
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
              📝 {supplier.notes}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

// ─── LedgerCard ─────────────────────────────────────────────────────────────
export function LedgerCard({
  entry,
  onPress,
  onEdit,
  onDelete,
}: {
  entry: {
    transactionType: string;
    referenceNumber: string;
    debit: number;
    credit: number;
    balance: number;
    createdAt: string;
  };
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { colors } = useTheme();
  const isSale = entry.transactionType === "sale";
  const typeColor = isSale ? colors.error : colors.success;
  const typeBg = isSale ? colors.errorLight : colors.successLight;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={[styles.txTypeBadge, { backgroundColor: typeBg }]}>
            <Text style={[styles.txTypeText, { color: typeColor }]}>
              {isSale ? "Sale (Debit)" : "Payment (Credit)"}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            {entry.referenceNumber}
          </Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {formatDateTime(entry.createdAt)}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.ledgerAmounts}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>
            {isSale ? "Debit" : "Credit"}
          </Text>
          <Text style={[styles.ledgerAmount, { color: typeColor }]}>
            {isSale ? `+${formatCurrency(entry.debit)}` : `-${formatCurrency(entry.credit)}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>Balance</Text>
          <Text style={[styles.ledgerAmount, { color: colors.text }]}>
            {formatCurrency(entry.balance)}
          </Text>
        </View>
      </View>

      {(onPress || onEdit || onDelete) && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          {onPress && (
            <ActionBtn label="View Details" onPress={onPress} color={colors.secondary} bgColor={colors.secondaryLight} />
          )}
          {onEdit && (
            <ActionBtn label="Edit" onPress={onEdit} color={colors.secondary} bgColor={colors.secondaryLight} />
          )}
          {onDelete && (
            <ActionBtn label="Delete" onPress={onDelete} color={colors.error} bgColor={colors.errorLight} />
          )}
        </View>
      )}
    </View>
  );
}

// ─── DataTable ─────────────────────────────────────────────────────────────
export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.tableRow, { backgroundColor: colors.primaryLight }]}>
          {headers.map((h) => (
            <Text key={h} style={[styles.headerCell, { color: colors.primary }]}>
              {h}
            </Text>
          ))}
        </View>
        {rows.map((row, i) => (
          <View
            key={i}
            style={[
              styles.tableRow,
              { borderBottomColor: colors.border, backgroundColor: i % 2 === 0 ? colors.surface : colors.background },
            ]}
          >
            {row.map((cell, j) => (
              <Text key={j} style={[styles.cell, { color: colors.text }]}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: 'flex-start' },
  divider: { height: 1, marginVertical: 12 },

  // Invoice
  invoiceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  invoiceNum: { fontSize: 13, fontWeight: "800" },
  dateText: { fontSize: 12 },
  shopName: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  itemName: { flex: 1, fontSize: 13, marginRight: 8 },
  itemTotal: { fontSize: 13, fontWeight: '600' },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grandRow: { marginTop: 4 },
  grandLabel: { fontSize: 15, fontWeight: "700" },
  grandValue: { fontSize: 16, fontWeight: "800" },

  // Payment
  methodRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 8 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  methodText: { fontSize: 11, fontWeight: '700' },
  paymentAmount: { fontSize: 18, fontWeight: "800" },
  notes: { fontSize: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },

  // Supplier
  supplierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supplierAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  supplierAvatarText: { fontSize: 16, fontWeight: '800' },
  supplierFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },

  // Ledger
  txTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  txTypeText: { fontSize: 12, fontWeight: '700' },
  ledgerAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  ledgerAmount: { fontSize: 18, fontWeight: '800', marginTop: 4 },

  // Actions
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // DataTable
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 11 },
  headerCell: { width: 130, paddingHorizontal: 12, fontSize: 12, fontWeight: "700", textTransform: 'uppercase', letterSpacing: 0.4 },
  cell: { width: 130, paddingHorizontal: 12, fontSize: 13 },
});
