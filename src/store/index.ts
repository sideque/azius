import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import shopReducer from './slices/shopSlice';
import salesReducer from './slices/salesSlice';
import paymentReducer from './slices/paymentSlice';
import ledgerReducer from './slices/ledgerSlice';
import reportReducer from './slices/reportSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    shops: shopReducer,
    sales: salesReducer,
    payments: paymentReducer,
    ledger: ledgerReducer,
    reports: reportReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
