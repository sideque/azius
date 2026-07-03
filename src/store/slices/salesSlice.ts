import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as db from "../../services/database";
import { CartItem, SaleWithDetails } from "../../types";
interface AuthStateLike {
  user: {
    id?: string;
  } | null;
}

interface SalesRootState {
  sales: SalesState;
  auth: AuthStateLike;
}
interface SalesState {
  cart: CartItem[];
  selectedShopId: string | null;
  discount: number;
  loading: boolean;
  error: string | null;
  lastSale: SaleWithDetails | null;
  recentSales: Awaited<ReturnType<typeof db.getRecentSales>>[number][];
  cartSyncVersion: number;
}

const initialState: SalesState = {
  cart: [],
  selectedShopId: null,
  discount: 0,
  loading: false,
  error: null,
  lastSale: null,
  recentSales: [],
  cartSyncVersion: 0,
};

export const createSale = createAsyncThunk(
  "sales/create",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { sales: SalesState };
    const { cart, selectedShopId, discount } = state.sales;
    if (!selectedShopId) return rejectWithValue("Please select a shop");
    if (cart.length === 0) return rejectWithValue("Cart is empty");
    try {
      const items = cart.map((c) => ({
        productId: c.productId,
        quantity: Number(c.quantity) || 0,
        rate: Number(c.rate) || 0,
        purchasePrice: Number(c.purchasePrice) || 0,
      }));
      if (items.some((item) => item.quantity <= 0)) {
        return rejectWithValue("Each item must have a valid quantity");
      }
      return await db.createSale(selectedShopId, items, Number(discount) || 0);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : "Failed to create sale",
      );
    }
  },
);

export const removeSale = createAsyncThunk(
  "sales/remove",
  async (id: string, { rejectWithValue }) => {
    try {
      await db.deleteSale(id);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : "Failed to delete sale");
    }
  },
);

export const updateSale = createAsyncThunk(
  "sales/update",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: any;
    },
    { rejectWithValue }
  ) => {
    try {
      await db.updateSaleData(id, data);
      return true;

    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchRecentSales = createAsyncThunk(
  "sales/fetchRecent",
  async () => {
    return db.getRecentSales(10);
  },
);

export const loadCartFromFirebase = createAsyncThunk(
  "sales/loadCartFromFirebase",
  async (userId: string | undefined) => {
    if (!userId) {
      return { cart: [], selectedShopId: null, discount: 0 };
    }
    return db.getCart(userId);
  },
);

export const syncCartToFirebase = createAsyncThunk(
  "sales/syncCartToFirebase",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as SalesRootState;
    const userId = state.auth.user?.id;
    if (!userId) {
      return null;
    }

    try {
      await db.saveCart(
        userId,
        state.sales.cart,
        state.sales.selectedShopId,
        state.sales.discount,
      );
      return {
        cart: state.sales.cart,
        selectedShopId: state.sales.selectedShopId,
        discount: state.sales.discount,
        cartSyncVersion: state.sales.cartSyncVersion,
      };
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : "Failed to sync cart",
      );
    }
  },
);

export const clearCartInFirebase = createAsyncThunk(
  "sales/clearCartInFirebase",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as SalesRootState;
    const userId = state.auth.user?.id;
    if (!userId) {
      return null;
    }

    try {
      await db.clearCartInDb(userId);
      return { cart: [], selectedShopId: null, discount: 0 };
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : "Failed to clear cart",
      );
    }
  },
);

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setSelectedShop: (state, action: PayloadAction<string | null>) => {
      state.selectedShopId = action.payload;
      state.cartSyncVersion += 1;
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.cart.find(
        (c) => c.productId === action.payload.productId,
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.cart.push(action.payload);
      }
      state.cartSyncVersion += 1;
    },
    updateCartQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) => {
      const item = state.cart.find(
        (c) => c.productId === action.payload.productId,
      );
      if (!item) return;

      if (action.payload.quantity <= 0) {
        state.cart = state.cart.filter(
          (c) => c.productId !== action.payload.productId,
        );
      } else {
        item.quantity = Math.max(0.1, action.payload.quantity);
      }
      state.cartSyncVersion += 1;
    },
    updateCartRate: (
      state,
      action: PayloadAction<{ productId: string; rate: number }>,
    ) => {
      const item = state.cart.find(
        (c) => c.productId === action.payload.productId,
      );
      if (!item) return;
      item.rate = Math.max(0, action.payload.rate);
      state.cartSyncVersion += 1;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((c) => c.productId !== action.payload);
      state.cartSyncVersion += 1;
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = Math.max(0, action.payload);
      state.cartSyncVersion += 1;
    },
    clearCart: (state) => {
      state.cart = [];
      state.discount = 0;
      state.cartSyncVersion += 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
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
      .addCase(fetchRecentSales.fulfilled, (state, action) => {
        state.recentSales = action.payload;
      })
      .addCase(loadCartFromFirebase.fulfilled, (state, action) => {
        state.cart = action.payload.cart;
        state.selectedShopId = action.payload.selectedShopId;
        state.discount = action.payload.discount;
        state.cartSyncVersion += 1;
      })
      .addCase(syncCartToFirebase.fulfilled, (state, action) => {
        if (
          action.payload &&
          action.payload.cartSyncVersion >= state.cartSyncVersion
        ) {
          state.cart = action.payload.cart;
          state.selectedShopId = action.payload.selectedShopId;
          state.discount = action.payload.discount;
          state.cartSyncVersion = action.payload.cartSyncVersion;
        }
      })
      .addCase(clearCartInFirebase.fulfilled, (state, action) => {
        if (action.payload) {
          state.cart = action.payload.cart;
          state.selectedShopId = action.payload.selectedShopId;
          state.discount = action.payload.discount;
          state.cartSyncVersion += 1;
        }
      });
  },
});

export const {
  setSelectedShop,
  addToCart,
  updateCartQuantity,
  updateCartRate,
  removeFromCart,
  setDiscount,
  clearCart,
  clearError,
} = salesSlice.actions;
export default salesSlice.reducer;
