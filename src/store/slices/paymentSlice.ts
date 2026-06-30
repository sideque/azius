import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as db from '../../services/database';
import { PaymentMethod } from '../../types';

interface PaymentState {
  loading: boolean;
  error: string | null;
  lastPayment: Awaited<ReturnType<typeof db.createPayment>> | null;
  recentPayments: Awaited<ReturnType<typeof db.getRecentPayments>>;
}

const initialState: PaymentState = {
  loading: false,
  error: null,
  lastPayment: null,
  recentPayments: [],
};

export const collectPayment = createAsyncThunk(
  'payments/collect',
  async (data: { shopId: string; amount: number; paymentMethod: PaymentMethod; notes: string; paymentDate: string }, { rejectWithValue }) => {
    try {
      return await db.createPayment(data.shopId, data.amount, data.paymentMethod, data.notes, data.paymentDate);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed');
    }
  },
);

export const removePayment = createAsyncThunk(
  'payments/remove',
  async (id: string, { rejectWithValue }) => {
    try {
      await db.deletePayment(id);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to delete payment');
    }
  },
);

export const updatePayment = createAsyncThunk(
  'payments/update',
  async (params: { id: string, data: { amount: number; paymentMethod: PaymentMethod; paymentDate: string; notes?: string } }, { rejectWithValue }) => {
    try {
      await db.updatePaymentData(params.id, params.data);
      return params.id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to update payment');
    }
  },
);

export const fetchRecentPayments = createAsyncThunk('payments/fetchRecent', async () => {
  return db.getRecentPayments(10);
});

export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async (params: { startDate?: string; endDate?: string; shopId?: string }) => {
    return db.getPayments(params.startDate, params.endDate, params.shopId);
  },
);

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearLastPayment: (state) => { state.lastPayment = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(collectPayment.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(collectPayment.fulfilled, (state, action) => { state.loading = false; state.lastPayment = action.payload; })
      .addCase(collectPayment.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchRecentPayments.fulfilled, (state, action) => { state.recentPayments = action.payload; })
      .addCase(fetchPayments.fulfilled, (state, action) => { state.recentPayments = action.payload; });
  },
});

export const { clearLastPayment, clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
