import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Dropdown,
  EmptyState,
  LedgerCard,
  LoadingComponent,
  Modal,
  CustomButton,
  InvoiceCard,
  PaymentCard,
} from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchShops } from "../../store/slices/shopSlice";
import { fetchLedger } from "../../store/slices/ledgerSlice";
import { removeSale } from "../../store/slices/salesSlice";
import { removePayment } from "../../store/slices/paymentSlice";
import * as db from "../../services/database";
import { useTheme } from "../../theme/ThemeContext";
import {
  formatCurrency,
  formatDate,
  getDateRange,
} from "../../utils/formatters";

import { LedgerEntry, SaleWithDetails, Payment } from "../../types";

type FilterPeriod = "daily" | "monthly" | "custom";

export function ShopLedgerScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const shops = useAppSelector((s) => s.shops.items);
  const { entries, selectedShop, loading } = useAppSelector((s) => s.ledger);
  const [shopId, setShopId] = useState("");
  const [period, setPeriod] = useState<FilterPeriod>("monthly");

  // Ledger entry viewing state
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [entryDetails, setEntryDetails] = useState<
    SaleWithDetails | (Payment & { shopName: string }) | null
  >(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadShops = useCallback(() => dispatch(fetchShops()), [dispatch]);
  useFocusEffect(
    useCallback(() => {
      loadShops();
    }, [loadShops]),
  );

  const loadLedger = (id: string, p: FilterPeriod) => {
    const filterPeriod =
      p === "daily" ? "daily" : p === "monthly" ? "monthly" : "custom";
    const { startDate, endDate } = getDateRange(filterPeriod);
    dispatch(fetchLedger({ shopId: id, startDate, endDate }));
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [dispatch(fetchShops())];
      if (shopId) {
        const filterPeriod =
          period === "daily"
            ? "daily"
            : period === "monthly"
              ? "monthly"
              : "custom";
        const { startDate, endDate } = getDateRange(filterPeriod);
        tasks.push(dispatch(fetchLedger({ shopId, startDate, endDate })));
      }
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, shopId, period]);

  const shopOptions = shops.map((s) => ({ label: s.shopName, value: s.id }));
  const periodOptions = [
    { label: "Today", value: "daily" },
    { label: "This Month", value: "monthly" },
    { label: "All Time", value: "custom" },
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
        const details = await db.getPaymentByReceiptNumber(
          entry.referenceNumber,
        );
        setEntryDetails(details);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditEntry = (entry: LedgerEntry) => {
    Alert.alert("Edit", "Edit functionality coming soon!");
  };

  const handleDeleteEntry = (entry: LedgerEntry | null = selectedEntry) => {
    if (!entry) return;
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this ${entry.transactionType}?`,
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
                  const details = await db.getSaleByInvoiceNumber(
                    entry.referenceNumber,
                  );
                  targetId = details?.id;
                } else {
                  const details = await db.getPaymentByReceiptNumber(
                    entry.referenceNumber,
                  );
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
              loadLedger(shopId, period); // Reload ledger
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete");
            }
          },
        },
      ],
    );
  };

  const lastSale = entries.find((e) => e.transactionType === "sale");
  const lastPayment = entries.find((e) => e.transactionType === "payment");
  // entries are sorted newest-first, so entries[0] carries the latest
  // running balance (matches the balance shown on the last ledger card).
  const currentOutstanding = entries.length
    ? entries[0].balance
    : (selectedShop?.outstandingBalance ?? 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* <Dropdown
        label="Select Shop"
        options={shopOptions}
        value={shopId}
        onChange={(v) => { setShopId(v); loadLedger(v, period); }}
        placeholder="Choose a shop..."
      /> */}
      <Dropdown
        label="Select Shop"
        options={shopOptions}
        value={shopId}
        onChange={(v) => {
          setShopId(v);
          loadLedger(v, period);
        }}
        placeholder="Choose a shop..."
      />

      {shopId && (
        <>
          <View style={styles.filters}>
            {periodOptions.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setPeriod(opt.value as FilterPeriod);
                  loadLedger(shopId, opt.value as FilterPeriod);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      period === opt.value ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: period === opt.value ? "#fff" : colors.text,
                    fontSize: 12,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedShop && (
            <View
              style={[
                styles.summary,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.shopName, { color: colors.text }]}>
                {selectedShop.shopName}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                {selectedShop.ownerName} • {selectedShop.phoneNumber}
              </Text>
              <Text
                style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}
              >
                {selectedShop.address}
              </Text>
              {/* <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    OUTSTANDING
                  </Text>
                  <Text
                    style={{
                      color: colors.warning,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(selectedShop.outstandingBalance)}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    CREDIT LIMIT
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(selectedShop.creditLimit)}
                  </Text>
                </View>
              </View> */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    OPENING BALANCE
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(selectedShop.openingBalance ?? 0)}
                  </Text>
                </View>

                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    OUTSTANDING
                  </Text>
                  <Text
                    style={{
                      color: colors.warning,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(currentOutstanding)}
                  </Text>
                </View>

                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    CREDIT LIMIT
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "700",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(selectedShop.creditLimit)}
                  </Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    LAST PURCHASE
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 13 }}>
                    {lastSale ? formatDate(lastSale.createdAt) : "N/A"}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                    LAST PAYMENT
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 13 }}>
                    {lastPayment ? formatDate(lastPayment.createdAt) : "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {loading ? (
            <LoadingComponent />
          ) : (
            <FlatList
              data={entries}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <EmptyState
                  title="No Transactions"
                  message="No ledger entries for this period"
                  icon="receipt-outline"
                />
              }
              renderItem={({ item }) => (
                <LedgerCard
                  entry={item}
                  onPress={() => handleLedgerPress(item)}
                />
              )}
              style={{ flex: 1 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </>
      )}

      <Modal
        visible={showDetailsModal}
        title={`${selectedEntry?.transactionType === "sale" ? "Sale" : "Payment"} Details`}
        onClose={() => setShowDetailsModal(false)}
      >
        {detailsLoading ? (
          <LoadingComponent />
        ) : entryDetails ? (
          <View>
            {selectedEntry?.transactionType === "sale" ? (
              <InvoiceCard sale={entryDetails as SaleWithDetails} />
            ) : (
              <PaymentCard payment={entryDetails as any} />
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <CustomButton
                title="Close"
                onPress={() => setShowDetailsModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <Text
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginVertical: 20,
            }}
          >
            Details not found
          </Text>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filters: { flexDirection: "row", marginBottom: 16, gap: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0.5,
  },
  summary: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  shopName: { fontSize: 18, fontWeight: "700" },
  statsRow: { flexDirection: "row", marginTop: 12 },
  stat: { flex: 1 },
});
