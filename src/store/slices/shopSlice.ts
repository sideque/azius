import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as db from '../../services/database';
import { Shop } from '../../types';

interface ShopState {
  items: Shop[];
  loading: boolean;
  error: string | null;
  search: string;
}

const initialState: ShopState = {
  items: [],
  loading: false,
  error: null,
  search: '',
};

export const fetchShops = createAsyncThunk('shops/fetchAll', async (_, { getState }) => {
  const state = getState() as { shops: ShopState };
  return db.getShops(state.shops.search);
});

export const addShop = createAsyncThunk('shops/add', async (shop: Omit<Shop, 'id' | 'outstandingBalance' | 'createdAt'>) => {
  return db.createShop(shop);
});

export const editShop = createAsyncThunk('shops/edit', async ({ id, shop }: { id: string; shop: Partial<Shop> }) => {
  await db.updateShop(id, shop);
  return db.getShopById(id);
});

export const removeShop = createAsyncThunk('shops/remove', async (id: string) => {
  await db.deleteShop(id);
  return id;
});

const shopSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (state) => { state.loading = true; })
      .addCase(fetchShops.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchShops.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Failed'; })
      .addCase(addShop.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(editShop.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.items.findIndex((s) => s.id === action.payload!.id);
          if (idx >= 0) state.items[idx] = action.payload;
        }
      })
      .addCase(removeShop.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      });
  },
});

export const { setSearch, clearError } = shopSlice.actions;
export default shopSlice.reducer;
