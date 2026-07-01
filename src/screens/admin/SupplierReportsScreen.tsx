import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  CustomButton,
  Dropdown,
  EmptyState,
  LoadingSkeleton,
  SummaryCard,
  SupplierCard,
  useToast,
} from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import {
  getSupplierBills,
  getSupplierPayments,
  getSuppliers,
} from "../../services/database";
import {
  Supplier,
  SupplierPaymentWithSupplier,
  SupplierPurchaseBill,
} from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { AdminDrawerParamList } from "../../navigation/types";

const periodOptions = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export function SupplierReportsScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">(
    "monthly",
  );
  const [bills, setBills] = useState<SupplierPurchaseBill[]>([]);
  const [payments, setPayments] = useState<SupplierPaymentWithSupplier[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === selectedSupplierId),
    [selectedSupplierId, suppliers],
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

  const loadReport = async () => {
    if (!selectedSupplierId) {
      setBills([]);
      setPayments([]);
      return;
    }

    setLoading(true);
    try {
      const [billsData, paymentsData] = await Promise.all([
        getSupplierBills(selectedSupplierId),
        getSupplierPayments(selectedSupplierId),
      ]);
      setBills(billsData);
      setPayments(paymentsData);
    } catch (error) {
      showToast("Failed to load supplier reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedSupplierId, showToast, period]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [selectedSupplierId, period]),
  );

  const totalBills = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const balance = totalBills - totalPayments;

  const supplierOptions = [
    { label: "Select Supplier", value: "" },
    ...suppliers.map((supplier) => ({
      label: supplier.supplierName,
      value: supplier.id,
    })),
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() =>
            selectedSupplierId && setSelectedSupplierId(selectedSupplierId)
          }
          colors={[colors.primary]}
        />
      }
    >
      <Dropdown
        label="Supplier"
        options={supplierOptions}
        value={selectedSupplierId}
        onChange={setSelectedSupplierId}
      />
      <Dropdown
        label="Period"
        options={periodOptions}
        value={period}
        onChange={(value) => setPeriod(value as "daily" | "monthly" | "yearly")}
      />

      {!selectedSupplier ? (
        <EmptyState
          title="Select a supplier"
          message="Choose a supplier to view purchase and payment history."
          icon="🏭"
        />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <SummaryCard
              title="Outstanding"
              value={formatCurrency(
                selectedSupplier.outstandingBalance ?? balance,
              )}
              color={colors.errorLight}
            />
            <SummaryCard
              title="Total Bills"
              value={formatCurrency(totalBills)}
              color={colors.primaryLight}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard
              title="Total Payments"
              value={formatCurrency(totalPayments)}
              color={colors.successLight}
            />
            <SummaryCard
              title="Balance"
              value={formatCurrency(balance)}
              color={colors.warningLight}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Bills
          </Text>
          {bills.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No bills found for this supplier.
            </Text>
          ) : (
            <FlatList
              data={bills}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.billNumber}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {formatDate(item.billDate)}
                  </Text>
                  <Text style={{ color: colors.text, marginTop: 8 }}>
                    {item.notes || "No notes"}
                  </Text>
                  <Text style={[styles.cardAmount, { color: colors.primary }]}>
                    {formatCurrency(item.totalAmount)}
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}

          <Text
            style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}
          >
            Recent Payments
          </Text>
          {payments.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No payments found for this supplier.
            </Text>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.receiptNumber}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {formatDate(item.paymentDate)}
                  </Text>
                  <Text style={{ color: colors.text, marginTop: 8 }}>
                    {item.paymentMethod}
                  </Text>
                  <Text style={[styles.cardAmount, { color: colors.success }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}

          <CustomButton
            title="Make Supplier Payment"
            onPress={() => navigation.navigate("SupplierPayments")}
            style={{ marginTop: 24 }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: { textAlign: "center", marginVertical: 20 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardAmount: { marginTop: 8, fontSize: 16, fontWeight: "700" },
});
