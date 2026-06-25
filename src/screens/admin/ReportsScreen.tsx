import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Dropdown, SummaryCard } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPaymentReport, fetchSalesReport } from '../../store/slices/reportSlice';
import { fetchLedger } from '../../store/slices/ledgerSlice';
import { fetchShops } from '../../store/slices/shopSlice';
import { useTheme } from '../../theme/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import { ReportFilter } from '../../types';
import { LedgerCard } from '../../components';

const screenWidth = Dimensions.get('window').width - 32;

type Tab = 'sales' | 'payments' | 'ledger';

export function ReportsScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { salesReport, paymentReport } = useAppSelector((s) => s.reports);
  const shops = useAppSelector((s) => s.shops.items);
  const ledgerEntries = useAppSelector((s) => s.ledger.entries);
  const [tab, setTab] = useState<Tab>('sales');
  const [period, setPeriod] = useState<ReportFilter['period']>('monthly');
  const [shopId, setShopId] = useState('');

  const load = useCallback(() => {
    dispatch(fetchShops());
    const filter: ReportFilter = { period, shopId: shopId || undefined };
    dispatch(fetchSalesReport(filter));
    dispatch(fetchPaymentReport(filter));
    if (shopId) dispatch(fetchLedger({ shopId }));
  }, [dispatch, period, shopId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shopOptions = [{ label: 'All Shops', value: '' }, ...shops.map((s) => ({ label: s.shopName, value: s.id }))];
  const periodOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[colors.primary]} />}
    >
      <View style={styles.tabs}>
        {(['sales', 'payments', 'ledger'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && { backgroundColor: colors.primary }]}>
            <Text style={{ color: tab === t ? '#fff' : colors.text, fontWeight: '600', textTransform: 'capitalize' }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Dropdown label="Period" options={periodOptions} value={period} onChange={(v) => { setPeriod(v as ReportFilter['period']); setTimeout(load, 100); }} />
      <Dropdown label="Shop" options={shopOptions} value={shopId} onChange={(v) => { setShopId(v); setTimeout(load, 100); }} />

      {tab === 'sales' && (
        <>
          <SummaryCard title="Total Sales" value={formatCurrency(salesReport.totalSales)} color={colors.primaryLight} />
          <SummaryCard title="Total Profit" value={formatCurrency(salesReport.totalProfit)} color={colors.successLight} />
          <SummaryCard title="Invoices" value={String(salesReport.productsSold)} />
          <Text style={[styles.section, { color: colors.text }]}>Shop-wise Sales</Text>
          {salesReport.shopWise.length > 0 && (
            <BarChart
              data={{
                labels: salesReport.shopWise.map((s) => s.shopName.slice(0, 8)),
                datasets: [{ data: salesReport.shopWise.map((s) => s.total || 0) }],
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
            <View key={i} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, flex: 1 }}>{s.shopName}</Text>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{formatCurrency(s.total)}</Text>
            </View>
          ))}
        </>
      )}

      {tab === 'payments' && (
        <>
          <SummaryCard title="Total Received" value={formatCurrency(paymentReport.totalReceived)} color={colors.successLight} />
          <SummaryCard title="Outstanding" value={formatCurrency(paymentReport.outstanding)} color={colors.warningLight} />
          <SummaryCard title="Pending" value={formatCurrency(paymentReport.pending)} color={colors.errorLight} />
        </>
      )}

      {tab === 'ledger' && (
        <>
          {!shopId ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>Select a shop to view ledger</Text>
          ) : (
            ledgerEntries.map((entry) => <LedgerCard key={entry.id} entry={entry} />)
          )}
        </>
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', marginBottom: 16 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, marginHorizontal: 4 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  chart: { borderRadius: 12, marginBottom: 12 },
  row: { flexDirection: 'row', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
});
