import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as db from '../../services/database';
import { Product } from '../../types';

interface ProductState {
  items: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  search: string;
  categoryFilter: string;
}

const initialState: ProductState = {
  items: [],
  categories: [],
  loading: false,
  error: null,
  search: '',
  categoryFilter: 'All',
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { getState }) => {
  const state = getState() as { products: ProductState };
  return db.getProducts(state.products.search, state.products.categoryFilter);
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async () => {
  return db.getProductCategories();
});

export const addProduct = createAsyncThunk('products/add', async (product: Omit<Product, 'id' | 'createdAt'>) => {
  return db.createProduct(product);
});

export const editProduct = createAsyncThunk('products/edit', async ({ id, product }: { id: string; product: Partial<Product> }) => {
  await db.updateProduct(id, product);
  return db.getProductById(id);
});

export const removeProduct = createAsyncThunk('products/remove', async (id: string) => {
  await db.deleteProduct(id);
  return id;
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearch: (state, action) => { state.search = action.payload; },
    setCategoryFilter: (state, action) => { state.categoryFilter = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'Failed to fetch products'; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; })
      .addCase(addProduct.fulfilled, (state, action) => { if (action.payload) state.items.unshift(action.payload); })
      .addCase(editProduct.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.items.findIndex((p) => p.id === action.payload!.id);
          if (idx >= 0) state.items[idx] = action.payload;
        }
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const { setSearch, setCategoryFilter, clearError } = productSlice.actions;
export default productSlice.reducer;
