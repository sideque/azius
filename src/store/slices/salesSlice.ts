import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as db from '../../services/database';
import { CartItem, SaleWithDetails } from '../../types';

interface SalesState {
  cart: CartItem[];
  selectedShopId: string | null;
  discount: number;
  loading: boolean;
  error: string | null;
  lastSale: SaleWithDetails | null;
  recentSales: (Awaited<ReturnType<typeof db.getRecentSales>>)[number][];
}

const initialState: SalesState = {
  cart: [],
  selectedShopId: null,
  discount: 0,
  loading: false,
  error: null,
  lastSale: null,
  recentSales: [],
};

export const createSale = createAsyncThunk(
  'sales/create',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { sales: SalesState };
    const { cart, selectedShopId, discount } = state.sales;
    if (!selectedShopId) return rejectWithValue('Please select a shop');
    if (cart.length === 0) return rejectWithValue('Cart is empty');
    try {
      const items = cart.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
        rate: c.rate,
        purchasePrice: c.purchasePrice,
      }));
      return db.createSale(selectedShopId, items, discount);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed to create sale');
    }
  },
);

export const fetchRecentSales = createAsyncThunk('sales/fetchRecent', async () => {
  return db.getRecentSales(10);
});

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setSelectedShop: (state, action: PayloadAction<string | null>) => {
      state.selectedShopId = action.payload;
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.cart.find((c) => c.productId === action.payload.productId);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.cart.push(action.payload);
      }
    },
    updateCartQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.cart.find((c) => c.productId === action.payload.productId);
      if (item) item.quantity = Math.max(1, action.payload.quantity);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((c) => c.productId !== action.payload);
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = Math.max(0, action.payload);
    },
    clearCart: (state) => {
      state.cart = [];
      state.discount = 0;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSale.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createSale.fulfilled, (state, action) => {
        state.loading = false;
        state.lastSale = action.payload;
        state.cart = [];
        state.discount = 0;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchRecentSales.fulfilled, (state, action) => { state.recentSales = action.payload; });
  },
});

export const { setSelectedShop, addToCart, updateCartQuantity, removeFromCart, setDiscount, clearCart, clearError } = salesSlice.actions;
export default salesSlice.reducer;
