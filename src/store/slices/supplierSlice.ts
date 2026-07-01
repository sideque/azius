import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as db from "../../services/database";
import { Supplier } from "../../types";

interface SupplierState {
  items: Supplier[];
  loading: boolean;
  error: string | null;
  search: string;
}

const initialState: SupplierState = {
  items: [],
  loading: false,
  error: null,
  search: "",
};

export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchAll",
  async (_, { getState }) => {
    const state = getState() as { suppliers: SupplierState };
    return db.getSuppliers(state.suppliers.search);
  },
);

export const addSupplier = createAsyncThunk(
  "suppliers/add",
  async (supplier: Omit<Supplier, "id" | "createdAt">) => {
    return db.createSupplier(supplier);
  },
);

export const editSupplier = createAsyncThunk(
  "suppliers/edit",
  async ({ id, supplier }: { id: string; supplier: Partial<Supplier> }) => {
    await db.updateSupplier(id, supplier);
    return db.getSupplierById(id);
  },
);

export const removeSupplier = createAsyncThunk(
  "suppliers/remove",
  async (id: string) => {
    await db.deleteSupplier(id);
    return id;
  },
);

const supplierSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch suppliers";
      })
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(editSupplier.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.items.findIndex((s) => s.id === action.payload!.id);
          if (idx >= 0) state.items[idx] = action.payload;
        }
      })
      .addCase(removeSupplier.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      });
  },
});

export const { setSearch, clearError } = supplierSlice.actions;
export default supplierSlice.reducer;
