import React, { useCallback } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { DashboardCard, EmptyState, LoadingSkeleton, PaymentCard } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboard } from '../../store/slices/reportSlice';
import { fetchRecentPayments } from '../../store/slices/paymentSlice';
import { fetchRecentSales } from '../../store/slices/salesSlice';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width - 32;

export function DashboardScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { dashboardStats, topProducts, chartData, loading } = useAppSelector((s) => s.reports);
  const recentSales = useAppSelector((s) => s.sales.recentSales);
  const recentPayments = useAppSelector((s) => s.payments.recentPayments);

  const load = useCallback(() => {
    console.log("🚀 DASHBOARD LOADING START");
    dispatch(fetchDashboard());
    dispatch(fetchRecentSales());
    dispatch(fetchRecentPayments());
  }, [dispatch]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !dashboardStats) return <LoadingSkeleton />;

  const stats = dashboardStats;

  const chartLabels: string[] = (chartData ?? []).map((d: { month: string }) => d.month);
  const salesData: number[] = (chartData ?? []).map((d: { sales: number }) => d.sales);
  const profitData: number[] = (chartData ?? []).map((d: { profit: number }) => d.profit);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
    >
      <Text style={[styles.section, { color: colors.text }]}>Overview</Text>
      <View style={styles.grid}>
        <DashboardCard title="Total Shops" value={stats?.totalShops ?? 0} icon="🏪" />
        <DashboardCard title="Total Products" value={stats?.totalProducts ?? 0} icon="📦" />
        <DashboardCard title="Sales Today" value={formatCurrency(stats?.salesToday ?? 0)} color={colors.primary} />
        <DashboardCard title="Sales This Month" value={formatCurrency(stats?.salesMonth ?? 0)} />
        <DashboardCard title="Sales This Year" value={formatCurrency(stats?.salesYear ?? 0)} />
        <DashboardCard title="Profit Today" value={formatCurrency(stats?.profitToday ?? 0)} color={colors.success} />
        <DashboardCard title="Profit This Month" value={formatCurrency(stats?.profitMonth ?? 0)} color={colors.success} />
        <DashboardCard title="Profit This Year" value={formatCurrency(stats?.profitYear ?? 0)} color={colors.success} />
        <DashboardCard title="Outstanding" value={formatCurrency(stats?.outstandingBalance ?? 0)} color={colors.warning} />
        <DashboardCard title="Payments Collected" value={formatCurrency(stats?.paymentsCollected ?? 0)} color={colors.secondary} />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Monthly Sales</Text>
      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{ labels: chartLabels, datasets: [{ data: salesData.length ? salesData : [0] }] }}
          width={Math.max(screenWidth, chartLabels.length * 60)}
          height={200}
          chartConfig={{
            backgroundColor: colors.card,
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 0,
            color: () => colors.primary,
            labelColor: () => colors.textSecondary,
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView> */}

      <Text style={[styles.section, { color: colors.text }]}>Monthly Profit</Text>
      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{ labels: chartLabels, datasets: [{ data: profitData.length ? profitData : [0] }] }}
          width={Math.max(screenWidth, chartLabels.length * 60)}
          height={200}
          chartConfig={{
            backgroundColor: colors.card,
            backgroundGradientFrom: colors.card,
            backgroundGradientTo: colors.card,
            decimalPlaces: 0,
            color: () => colors.success,
            labelColor: () => colors.textSecondary,
          }}
          bezier
          style={styles.chart}
        />
      </ScrollView> */}

      <Text style={[styles.section, { color: colors.text }]}>Top Selling Products</Text>
      {topProducts.length === 0 ? (
        <EmptyState title="No sales yet" message="Top products will appear here" icon="📊" />
      ) : (
        topProducts.map((p: { productName: string; totalQuantity: number; totalRevenue: number }, i: number) => (
          <View key={i} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rank, { color: colors.primary }]}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{p.productName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Qty: {p.totalQuantity}</Text>
            </View>
            <Text style={{ color: colors.success, fontWeight: '700' }}>{formatCurrency(p.totalRevenue)}</Text>
          </View>
        ))
      )}

      <Text style={[styles.section, { color: colors.text }]}>Recent Sales</Text>
      {recentSales.length === 0 ? (
        <EmptyState title="No recent sales" icon="🧾" />
      ) : (
        recentSales.map((sale) => (
          <View key={sale.id} style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{sale.invoiceNumber}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{sale.shopName}</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatCurrency(sale.grandTotal)}</Text>
          </View>
        ))
      )}

      <Text style={[styles.section, { color: colors.text }]}>Recent Payments</Text>
      {recentPayments.map((p: (typeof recentPayments)[number]) => <PaymentCard key={p.id} payment={p} />)}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  chart: { borderRadius: 12, marginBottom: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  rank: { fontSize: 16, fontWeight: '800', marginRight: 12, width: 30 },
});
