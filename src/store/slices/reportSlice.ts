import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as db from '../../services/database';
import { DashboardStats, ReportFilter } from '../../types';
import { getDateRange } from '../../utils/formatters';

interface ReportState {
  dashboardStats: DashboardStats | null;
  topProducts: Awaited<ReturnType<typeof db.getTopSellingProducts>>;
  chartData: Awaited<ReturnType<typeof db.getMonthlyChartData>>;
  salesReport: { totalSales: number; totalProfit: number; productsSold: number; shopWise: { shopName: string; total: number }[] };
  paymentReport: { totalReceived: number; pending: number; outstanding: number };
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  dashboardStats: null,
  topProducts: [],
  chartData: [],
  salesReport: { totalSales: 0, totalProfit: 0, productsSold: 0, shopWise: [] },
  paymentReport: { totalReceived: 0, pending: 0, outstanding: 0 },
  loading: false,
  error: null,
};

export const fetchDashboard = createAsyncThunk('reports/dashboard', async () => {
  const [stats, topProducts, chartData, recentSales, recentPayments] = await Promise.all([
    db.getDashboardStats(),
    db.getTopSellingProducts(),
    db.getMonthlyChartData(),
    db.getRecentSales(5),
    db.getRecentPayments(5),
  ]);
  return { stats, topProducts, chartData, recentSales, recentPayments };
});

export const fetchSalesReport = createAsyncThunk('reports/sales', async (filter: ReportFilter) => {
  const { startDate, endDate } = getDateRange(filter.period, filter.startDate, filter.endDate);
  const sales = await db.getSales(startDate, endDate, filter.shopId);
  const totalSales = sales.reduce((s, sale) => s + sale.grandTotal, 0);
  const totalProfit = sales.reduce((s, sale) => s + sale.profit, 0);
  const shopMap = new Map<string, number>();
  sales.forEach((sale) => {
    shopMap.set(sale.shopName, (shopMap.get(sale.shopName) ?? 0) + sale.grandTotal);
  });
  return {
    totalSales,
    totalProfit,
    productsSold: sales.length,
    shopWise: Array.from(shopMap.entries()).map(([shopName, total]) => ({ shopName, total })),
  };
});

export const fetchPaymentReport = createAsyncThunk('reports/payments', async (filter: ReportFilter) => {
  const { startDate, endDate } = getDateRange(filter.period, filter.startDate, filter.endDate);
  const [payments, stats] = await Promise.all([
    db.getPayments(startDate, endDate, filter.shopId),
    db.getDashboardStats(),
  ]);
  return {
    totalReceived: payments.reduce((s, p) => s + p.amount, 0),
    pending: stats.outstandingBalance,
    outstanding: stats.outstandingBalance,
  };
});

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload.stats;
        state.topProducts = action.payload.topProducts;
        state.chartData = action.payload.chartData;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed';
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => { state.salesReport = action.payload; })
      .addCase(fetchPaymentReport.fulfilled, (state, action) => { state.paymentReport = action.payload; });
  },
});

export const { clearError } = reportSlice.actions;
export default reportSlice.reducer;
