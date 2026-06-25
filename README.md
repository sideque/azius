# Supplier Distribution Management System

A production-ready React Native mobile application for managing supplier distribution operations — products, shops, sales, invoices, payments, ledgers, and analytics.

## Tech Stack

- **React Native** (Expo SDK 56) with **TypeScript**
- **React Navigation** — Stack, Drawer, Bottom Tabs
- **Redux Toolkit** — State management with async thunks
- **Expo SQLite** — Local database storage
- **React Native Chart Kit** — Dashboard analytics
- **Dark Mode** support

## Getting Started

```bash
npm install
npm start
```

Then press `a` for Android or `i` for iOS simulator, or scan the QR code with Expo Go.

## Demo Credentials

| Username | Password  | Role  |
|----------|-----------|-------|
| admin    | admin123  | Admin |
| sales    | sales123  | Sales |

## App Structure

```
src/
├── components/     # Reusable UI components
├── navigation/     # Auth, Admin Drawer, Sales Tabs
├── screens/
│   ├── auth/       # Splash, Login, Role Selection
│   ├── admin/      # Dashboard, Products, Shops, Reports, Settings
│   └── sales/      # Create Sale, Collect Payment, Shop Ledger
├── services/       # SQLite database layer
├── store/          # Redux slices
├── theme/          # Colors & dark mode
├── types/          # TypeScript interfaces
└── utils/          # Validation & formatters
```

## Features

### Authentication
- Splash screen with loading animation
- Login with Remember Me
- Role selection: Admin Panel / Sales Panel

### Admin Panel (Drawer Navigation)
- **Dashboard** — KPIs, charts, recent sales/payments, top products
- **Products** — CRUD, search, category filter, stock tracking
- **Shops** — CRUD, outstanding balance, credit limits
- **Reports** — Sales, payments, ledger with date/shop filters
- **Notifications** — Low stock, outstanding balance, payment due alerts
- **Settings** — Profile, password, backup, dark mode, logout

### Sales Panel (Bottom Tabs — No Dashboard)
- **Create Sale** — Shop selection, product cart, discount, invoice
- **Collect Payment** — Cash/UPI/Bank Transfer with receipt
- **Shop Ledger** — Transaction history with filters

### Business Logic
- Auto stock deduction on sale (prevents overselling)
- Outstanding balance = Total Purchases − Total Payments
- Profit = Selling Price − Purchase Price
- Ledger entries for every sale and payment

## License

MIT
