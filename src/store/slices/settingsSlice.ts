import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as db from "../../services/database";
import { NotificationItem, Product, Shop } from "../../types";
import {
  formatCurrency,
  generateId,
  toISOString,
} from "../../utils/formatters";

interface SettingsState {
  notifications: NotificationItem[];
  backupData: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  notifications: [],
  backupData: null,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "settings/notifications",
  async () => {
    const [lowStock, highOutstanding]: [Product[], Shop[]] = await Promise.all([
      db.getLowStockProducts(20),
      db.getShopsWithHighOutstanding(10000),
    ]);
    const notifications: NotificationItem[] = [];
    const now = toISOString();

    lowStock.forEach((p) => {
      notifications.push({
        id: generateId(),
        type: "low_stock",
        title: "Low Stock Alert",
        message: `${p.productName} (${p.productCode}) has only ${p.stockQuantity} ${p.unit} left`,
        createdAt: now,
        read: false,
      });
    });

    highOutstanding.forEach((s) => {
      notifications.push({
        id: generateId(),
        type: "outstanding",
        title: "Outstanding Balance Alert",
        message: `${s.shopName} has outstanding balance of ${formatCurrency(s.outstandingBalance)}`,
        createdAt: now,
        read: false,
      });
      if (s.outstandingBalance > s.creditLimit * 0.8 && s.creditLimit > 0) {
        notifications.push({
          id: generateId(),
          type: "payment_due",
          title: "Payment Due Alert",
          message: `${s.shopName} is approaching credit limit`,
          createdAt: now,
          read: false,
        });
      }
    });

    return notifications;
  },
);

export const backupDatabase = createAsyncThunk("settings/backup", async () => {
  return db.exportAllData();
});

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    markNotificationRead: (state, action) => {
      const n = state.notifications.find((item) => item.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(backupDatabase.pending, (state) => {
        state.loading = true;
      })
      .addCase(backupDatabase.fulfilled, (state, action) => {
        state.loading = false;
        state.backupData = action.payload;
      })
      .addCase(backupDatabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Backup failed";
      });
  },
});

export const { markNotificationRead, markAllRead, clearError } =
  settingsSlice.actions;
export default settingsSlice.reducer;
