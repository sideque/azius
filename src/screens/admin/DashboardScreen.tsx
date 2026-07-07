import React, { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DashboardCard, LoadingSkeleton } from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchDashboard } from "../../store/slices/reportSlice";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency } from "../../utils/formatters";

export function DashboardScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { dashboardStats, loading } = useAppSelector((s) => s.reports);

  const load = useCallback(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && !dashboardStats) return <LoadingSkeleton />;

  const stats = dashboardStats;

  const cashCollectedToday = stats?.paymentsCollectedCashToday ?? 0;
  const upiCollectedToday = stats?.paymentsCollectedUPIToday ?? 0;
  const bankCollectedToday = stats?.paymentsCollectedBankTransferToday ?? 0;
  const totalCollectedToday = stats?.paymentsCollectedToday ?? 0;
  const pctToday = (value: number) =>
    totalCollectedToday > 0
      ? `${Math.round((value / totalCollectedToday) * 100)}% of today`
      : "No payments yet today";

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
      <Text style={[styles.section, { color: colors.text }]}>Overview</Text>
      <View style={styles.grid}>
        <DashboardCard
          title="Sales Today"
          value={formatCurrency(stats?.salesToday ?? 0)}
          color={colors.primary}
          icon="trending-up-outline"
        />
        <DashboardCard
          title="Sales This Month"
          value={formatCurrency(stats?.salesMonth ?? 0)}
          icon="calendar-outline"
        />
        <DashboardCard
          title="Net Profit Today"
          value={formatCurrency(stats?.profitToday ?? 0)}
          color={colors.success}
          icon="trophy-outline"
        />
        <DashboardCard
          title="Net Profit Month"
          value={formatCurrency(stats?.profitMonth ?? 0)}
          color={colors.success}
          icon="trophy-outline"
        />
        <DashboardCard
          title="Net Profit Year"
          value={formatCurrency(stats?.profitYear ?? 0)}
          color={colors.success}
          icon="trophy-outline"
        />
        <DashboardCard
          title="Payments Collected Today"
          value={formatCurrency(totalCollectedToday)}
          color={colors.secondary}
          icon="wallet-outline"
        />
        <DashboardCard
          title="Expenses Today"
          value={formatCurrency(stats?.expensesToday ?? 0)}
          color={colors.error}
          icon="arrow-down-circle-outline"
        />
        <DashboardCard
          title="Expenses This Month"
          value={formatCurrency(stats?.expensesMonth ?? 0)}
          color={colors.error}
          icon="arrow-down-circle-outline"
        />
        <DashboardCard
          title="Expenses This Year"
          value={formatCurrency(stats?.expensesYear ?? 0)}
          color={colors.error}
          icon="arrow-down-circle-outline"
        />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>
        Payments Collected — Today
      </Text>
      <View style={styles.grid}>
        <DashboardCard
          title="Cash"
          value={formatCurrency(cashCollectedToday)}
          subtitle={pctToday(cashCollectedToday)}
          color={colors.success}
          icon="cash-outline"
        />
        <DashboardCard
          title="Google Pay / UPI"
          value={formatCurrency(upiCollectedToday)}
          subtitle={pctToday(upiCollectedToday)}
          color={colors.secondary}
          icon="phone-portrait-outline"
        />
        <DashboardCard
          title="Bank Transfer"
          value={formatCurrency(bankCollectedToday)}
          subtitle={pctToday(bankCollectedToday)}
          color={colors.info}
          icon="business-outline"
        />
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 12 },
});
