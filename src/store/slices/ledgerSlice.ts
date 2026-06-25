import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as db from '../../services/database';
import { LedgerEntry, Shop } from '../../types';

interface LedgerState {
  entries: LedgerEntry[];
  selectedShop: Shop | null;
  loading: boolean;
  error: string | null;
}

const initialState: LedgerState = {
  entries: [],
  selectedShop: null,
  loading: false,
  error: null,
};

export const fetchLedger = createAsyncThunk(
  'ledger/fetch',
  async (params: { shopId: string; startDate?: string; endDate?: string }) => {
    const [entries, shop] = await Promise.all([
      db.getLedgerEntries(params.shopId, params.startDate, params.endDate),
      db.getShopById(params.shopId),
    ]);
    return { entries, shop };
  },
);

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    clearLedger: (state) => { state.entries = []; state.selectedShop = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedger.pending, (state) => { state.loading = true; })
      .addCase(fetchLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.selectedShop = action.payload.shop;
      })
      .addCase(fetchLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed';
      });
  },
});

export const { clearLedger, clearError } = ledgerSlice.actions;
export default ledgerSlice.reducer;
