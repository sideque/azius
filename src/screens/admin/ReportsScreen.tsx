import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BarChart } from "react-native-chart-kit";
import { Dropdown, SummaryCard, Modal, CustomButton, InvoiceCard, PaymentCard } from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchPaymentReport,
  fetchSalesReport,
} from "../../store/slices/reportSlice";
import { fetchLedger } from "../../store/slices/ledgerSlice";
import { fetchShops } from "../../store/slices/shopSlice";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/formatters";
import { ReportFilter, LedgerEntry, SaleWithDetails, Payment } from "../../types";
import { LedgerCard } from "../../components";
import { removeSale } from "../../store/slices/salesSlice";
import { removePayment } from "../../store/slices/paymentSlice";
import * as db from "../../services/database";

const screenWidth = Dimensions.get("window").width - 32;

type Tab = "sales" | "payments" | "ledger";

export function ReportsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { salesReport, paymentReport } = useAppSelector((s) => s.reports);
  const shops = useAppSelector((s) => s.shops.items);
  const ledgerEntries = useAppSelector((s) => s.ledger.entries);
  const [tab, setTab] = useState<Tab>("sales");
  const [period, setPeriod] = useState<ReportFilter["period"]>("monthly");
  const [shopId, setShopId] = useState("");
  const [loading, setLoading] = useState(false);

  // Ledger entry viewing state
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [entryDetails, setEntryDetails] = useState<SaleWithDetails | (Payment & { shopName: string }) | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // const load = useCallback(() => {
  //   dispatch(fetchShops());
  //   const filter: ReportFilter = { period, shopId: shopId || undefined };
  //   dispatch(fetchSalesReport(filter));
  //   dispatch(fetchPaymentReport(filter));
  //   if (shopId) dispatch(fetchLedger({ shopId }));
  // }, [dispatch, period, shopId]);
  const load = useCallback(async () => {
    setLoading(true);
    const filter: ReportFilter = {
      period,
      shopId: shopId || undefined,
    };
    try {
      await Promise.all([
        dispatch(fetchShops()),
        dispatch(fetchSalesReport(filter)),
        dispatch(fetchPaymentReport(filter)),
        shopId ? dispatch(fetchLedger({ shopId })) : Promise.resolve(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, period, shopId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shopOptions = [
    { label: "All Shops", value: "" },
    ...shops.map((s) => ({ label: s.shopName, value: s.id })),
  ];
  const periodOptions = [
    { label: "Daily", value: "daily" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ];

  const handleLedgerPress = async (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setEntryDetails(null);
    try {
      if (entry.transactionType === "sale") {
        const details = await db.getSaleByInvoiceNumber(entry.referenceNumber);
        setEntryDetails(details);
      } else {
        const details = await db.getPaymentByReceiptNumber(entry.referenceNumber);
        setEntryDetails(details);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditEntry = async (entry: LedgerEntry | null = selectedEntry) => {
    if (!entry) return;
    try {
      if (entry.transactionType === "sale") {
        const details = await db.getSaleByInvoiceNumber(entry.referenceNumber);
        if (details) navigation.navigate("EditSale", { saleId: details.id, invoiceNumber: details.invoiceNumber });
      } else {
        const details = await db.getPaymentByReceiptNumber(entry.referenceNumber);
        if (details) navigation.navigate("EditPayment", { paymentId: details.id, receiptNumber: details.receiptNumber });
      }
    } catch (e) {
      Alert.alert("Error", "Could not load edit screen");
    }
    setShowDetailsModal(false);
  };

  const handleDeleteEntry = (entry: LedgerEntry | null = selectedEntry) => {
    if (!entry) return;
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this ${entry.transactionType}? This will revert stock and shop balances.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              let targetId = entryDetails?.id;
              // If we are deleting directly from the card and don't have details loaded yet
              if (!targetId || selectedEntry?.id !== entry.id) {
                 if (entry.transactionType === "sale") {
                   const details = await db.getSaleByInvoiceNumber(entry.referenceNumber);
                   targetId = details?.id;
                 } else {
                   const details = await db.getPaymentByReceiptNumber(entry.referenceNumber);
                   targetId = details?.id;
                 }
              }

              if (!targetId) throw new Error("Could not find record to delete");

              if (entry.transactionType === "sale") {
                await dispatch(removeSale(targetId)).unwrap();
              } else if (entry.transactionType === "payment") {
                await dispatch(removePayment(targetId)).unwrap();
              }
              setShowDetailsModal(false);
              load(); // Reload reports and ledger
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={load}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.tabs}>
        {(["sales", "payments", "ledger"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tab,
              tab === t && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={{
                color: tab === t ? "#fff" : colors.text,
                fontWeight: "600",
                textTransform: "capitalize",
              }}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      <Dropdown
        label="Period"
        options={periodOptions}
        value={period}
        onChange={(v) => {
          setPeriod(v as ReportFilter["period"]);
        }}
      />
      <Dropdown
        label="Shop"
        options={shopOptions}
        value={shopId}
        onChange={(v) => {
          setShopId(v);
        }}
      />

      {tab === "sales" && (
        <>
          <SummaryCard
            title="Total Sales"
            value={formatCurrency(salesReport.totalSales)}
            color={colors.primaryLight}
          />
          <SummaryCard
            title="Total Profit"
            value={formatCurrency(salesReport.totalProfit)}
            color={colors.successLight}
          />
          <SummaryCard
            title="Invoices"
            value={String(salesReport.productsSold)}
          />
          <Text style={[styles.section, { color: colors.text }]}>
            Shop-wise Sales
          </Text>
          {salesReport.shopWise.length > 0 && (
            <BarChart
              data={{
                labels: salesReport.shopWise.map((s) => s.shopName.slice(0, 8)),
                datasets: [
                  { data: salesReport.shopWise.map((s) => s.total || 0) },
                ],
              }}
              width={screenWidth}
              height={220}
              yAxisLabel="₹"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                color: () => colors.primary,
                labelColor: () => colors.textSecondary,
              }}
              style={styles.chart}
            />
          )}
          {salesReport.shopWise.map((s, i) => (
            <View
              key={i}
              style={[
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: colors.text, flex: 1 }}>{s.shopName}</Text>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>
                {formatCurrency(s.total)}
              </Text>
            </View>
          ))}
        </>
      )}

      {tab === "payments" && (
        <>
          <SummaryCard
            title="Total Received"
            value={formatCurrency(paymentReport.totalReceived)}
            color={colors.successLight}
          />
          <SummaryCard
            title="Outstanding"
            value={formatCurrency(paymentReport.outstanding)}
            color={colors.warningLight}
          />
          <SummaryCard
            title="Pending"
            value={formatCurrency(paymentReport.pending)}
            color={colors.errorLight}
          />
        </>
      )}

      {tab === "ledger" && (
        <>
          {!shopId ? (
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Select a shop to view ledger
            </Text>
          ) : (
            ledgerEntries.map((entry) => (
              <LedgerCard key={entry.id} entry={entry} onPress={() => handleLedgerPress(entry)} onEdit={() => handleEditEntry(entry)} onDelete={() => handleDeleteEntry(entry)} />
            ))
          )}
        </>
      )}
      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
      )}
      <View style={{ height: 24 }} />

      <Modal visible={showDetailsModal} title={`${selectedEntry?.transactionType === 'sale' ? 'Sale' : 'Payment'} Details`} onClose={() => setShowDetailsModal(false)}>
        {detailsLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : entryDetails ? (
          <View>
            {selectedEntry?.transactionType === 'sale' ? (
              <InvoiceCard sale={entryDetails as SaleWithDetails} />
            ) : (
              <PaymentCard payment={entryDetails as any} />
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <CustomButton title="Delete" onPress={() => handleDeleteEntry(selectedEntry)} style={{ backgroundColor: colors.error, flex: 1, marginRight: 8 }} />
              <CustomButton title="Close" onPress={() => setShowDetailsModal(false)} variant="outline" style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }}>Details not found</Text>
        )}
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: "row", marginBottom: 16 },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 10,
    marginHorizontal: 4,
  },
  section: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  chart: { borderRadius: 12, marginBottom: 12 },
  row: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
});
