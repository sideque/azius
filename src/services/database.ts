import * as SQLite from 'expo-sqlite';
import {
  DashboardStats,
  LedgerEntry,
  Payment,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  SaleWithDetails,
  Shop,
  User,
} from '../types';
import { generateId, generateInvoiceNumber, toISOString } from '../utils/formatters';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('supplier_management.db');
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      productName TEXT NOT NULL,
      productCode TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      purchasePrice REAL NOT NULL,
      sellingPrice REAL NOT NULL,
      stockQuantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      shopName TEXT NOT NULL,
      ownerName TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      address TEXT NOT NULL,
      creditLimit REAL NOT NULL DEFAULT 0,
      outstandingBalance REAL NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT UNIQUE NOT NULL,
      shopId TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      grandTotal REAL NOT NULL,
      profit REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (shopId) REFERENCES shops(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      saleId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      shopId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      notes TEXT,
      paymentDate TEXT NOT NULL,
      FOREIGN KEY (shopId) REFERENCES shops(id)
    );

    CREATE TABLE IF NOT EXISTS ledgers (
      id TEXT PRIMARY KEY,
      shopId TEXT NOT NULL,
      transactionType TEXT NOT NULL,
      referenceNumber TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (shopId) REFERENCES shops(id)
    );
  `);

  const users = await database.getAllAsync<User>('SELECT * FROM users LIMIT 1');
  if (users.length === 0) {
    await seedDatabase(database);
  }
}

async function seedDatabase(database: SQLite.SQLiteDatabase) {
  const adminId = generateId();
  const salesId = generateId();
  const now = toISOString();

  await database.runAsync(
    'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)',
    adminId, 'admin', 'admin123', 'admin', 'Administrator',
  );
  await database.runAsync(
    'INSERT INTO users (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)',
    salesId, 'sales', 'sales123', 'sales', 'Sales Representative',
  );

  const products = [
    { name: 'Premium Rice 25kg', code: 'PR-001', category: 'Grains', purchase: 850, selling: 950, stock: 100, unit: 'Bag' },
    { name: 'Sunflower Oil 1L', code: 'SO-001', category: 'Oil', purchase: 120, selling: 145, stock: 200, unit: 'Bottle' },
    { name: 'Sugar 1kg', code: 'SG-001', category: 'Grocery', purchase: 42, selling: 50, stock: 500, unit: 'Pack' },
    { name: 'Wheat Flour 10kg', code: 'WF-001', category: 'Grains', purchase: 320, selling: 380, stock: 80, unit: 'Bag' },
    { name: 'Tea Powder 500g', code: 'TP-001', category: 'Beverages', purchase: 180, selling: 220, stock: 150, unit: 'Pack' },
  ];

  for (const p of products) {
    await database.runAsync(
      `INSERT INTO products (id, productName, productCode, category, purchasePrice, sellingPrice, stockQuantity, unit, description, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      generateId(), p.name, p.code, p.category, p.purchase, p.selling, p.stock, p.unit, '', now,
    );
  }

  const shops = [
    { name: 'Raj General Store', owner: 'Raj Kumar', phone: '9876543210', address: '123 Main Street, Delhi', credit: 50000 },
    { name: 'Sharma Kirana', owner: 'Amit Sharma', phone: '9876543211', address: '45 Market Road, Mumbai', credit: 30000 },
    { name: 'City Mart', owner: 'Priya Singh', phone: '9876543212', address: '78 Park Avenue, Bangalore', credit: 75000 },
  ];

  for (const s of shops) {
    await database.runAsync(
      `INSERT INTO shops (id, shopName, ownerName, phoneNumber, address, creditLimit, outstandingBalance, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      generateId(), s.name, s.owner, s.phone, s.address, s.credit, 0, '', now,
    );
  }
}

// Auth
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const database = await getDatabase();
  return database.getFirstAsync<User>(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    username.trim(), password,
  );
}

export async function getUserById(id: string): Promise<User | null> {
  const database = await getDatabase();
  return database.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', id);
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE users SET password = ? WHERE id = ?', newPassword, userId);
}

export async function updateUserProfile(userId: string, name: string, email: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE users SET name = ?, email = ? WHERE id = ?', name, email, userId);
}

// Products
export async function getProducts(search?: string, category?: string): Promise<Product[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: string[] = [];
  if (search) {
    query += ' AND (productName LIKE ? OR productCode LIKE ? OR category LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY productName ASC';
  return database.getAllAsync<Product>(query, ...params);
}

export async function getProductById(id: string): Promise<Product | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const database = await getDatabase();
  const id = generateId();
  const createdAt = toISOString();
  await database.runAsync(
    `INSERT INTO products (id, productName, productCode, category, purchasePrice, sellingPrice, stockQuantity, unit, description, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, product.productName, product.productCode, product.category,
    product.purchasePrice, product.sellingPrice, product.stockQuantity,
    product.unit, product.description, createdAt,
  );
  return { ...product, id, createdAt };
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
  const database = await getDatabase();
  const existing = await getProductById(id);
  if (!existing) throw new Error('Product not found');
  await database.runAsync(
    `UPDATE products SET productName=?, productCode=?, category=?, purchasePrice=?, sellingPrice=?,
     stockQuantity=?, unit=?, description=? WHERE id=?`,
    product.productName ?? existing.productName,
    product.productCode ?? existing.productCode,
    product.category ?? existing.category,
    product.purchasePrice ?? existing.purchasePrice,
    product.sellingPrice ?? existing.sellingPrice,
    product.stockQuantity ?? existing.stockQuantity,
    product.unit ?? existing.unit,
    product.description ?? existing.description,
    id,
  );
}

export async function deleteProduct(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM products WHERE id = ?', id);
}

export async function getProductCategories(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM products ORDER BY category',
  );
  return rows.map((r) => r.category);
}

// Shops
export async function getShops(search?: string): Promise<Shop[]> {
  const database = await getDatabase();
  if (search) {
    const term = `%${search}%`;
    return database.getAllAsync<Shop>(
      `SELECT * FROM shops WHERE shopName LIKE ? OR ownerName LIKE ? OR phoneNumber LIKE ? ORDER BY shopName`,
      term, term, term,
    );
  }
  return database.getAllAsync<Shop>('SELECT * FROM shops ORDER BY shopName');
}

export async function getShopById(id: string): Promise<Shop | null> {
  const database = await getDatabase();
  return database.getFirstAsync<Shop>('SELECT * FROM shops WHERE id = ?', id);
}

export async function createShop(shop: Omit<Shop, 'id' | 'outstandingBalance' | 'createdAt'>): Promise<Shop> {
  const database = await getDatabase();
  const id = generateId();
  const createdAt = toISOString();
  await database.runAsync(
    `INSERT INTO shops (id, shopName, ownerName, phoneNumber, address, creditLimit, outstandingBalance, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    id, shop.shopName, shop.ownerName, shop.phoneNumber, shop.address, shop.creditLimit, shop.notes, createdAt,
  );
  return { ...shop, id, outstandingBalance: 0, createdAt };
}

export async function updateShop(id: string, shop: Partial<Shop>): Promise<void> {
  const database = await getDatabase();
  const existing = await getShopById(id);
  if (!existing) throw new Error('Shop not found');
  await database.runAsync(
    `UPDATE shops SET shopName=?, ownerName=?, phoneNumber=?, address=?, creditLimit=?, notes=? WHERE id=?`,
    shop.shopName ?? existing.shopName,
    shop.ownerName ?? existing.ownerName,
    shop.phoneNumber ?? existing.phoneNumber,
    shop.address ?? existing.address,
    shop.creditLimit ?? existing.creditLimit,
    shop.notes ?? existing.notes,
    id,
  );
}

export async function deleteShop(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM shops WHERE id = ?', id);
}

// Sales
export async function createSale(
  shopId: string,
  items: { productId: string; quantity: number; rate: number; purchasePrice: number }[],
  discount: number,
): Promise<SaleWithDetails> {
  const database = await getDatabase();
  const shop = await getShopById(shopId);
  if (!shop) throw new Error('Shop not found');

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product) throw new Error(`Product not found`);
    if (item.quantity > product.stockQuantity) {
      throw new Error(`Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}`);
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const itemProfit = items.reduce((sum, i) => sum + (i.rate - i.purchasePrice) * i.quantity, 0);
  const profit = subtotal > 0 ? itemProfit * (grandTotal / subtotal) : itemProfit;
  const saleId = generateId();
  const invoiceNumber = generateInvoiceNumber();
  const createdAt = toISOString();

  await database.withTransactionAsync(async () => {
    await database!.runAsync(
      `INSERT INTO sales (id, invoiceNumber, shopId, subtotal, discount, grandTotal, profit, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      saleId, invoiceNumber, shopId, subtotal, discount, grandTotal, profit, createdAt,
    );

    for (const item of items) {
      const itemId = generateId();
      const total = item.quantity * item.rate;
      await database!.runAsync(
        'INSERT INTO sale_items (id, saleId, productId, quantity, rate, total) VALUES (?, ?, ?, ?, ?, ?)',
        itemId, saleId, item.productId, item.quantity, item.rate, total,
      );
      await database!.runAsync(
        'UPDATE products SET stockQuantity = stockQuantity - ? WHERE id = ?',
        item.quantity, item.productId,
      );
    }

    const newBalance = shop.outstandingBalance + grandTotal;
    await database!.runAsync('UPDATE shops SET outstandingBalance = ? WHERE id = ?', newBalance, shopId);

    await database!.runAsync(
      `INSERT INTO ledgers (id, shopId, transactionType, referenceNumber, debit, credit, balance, createdAt)
       VALUES (?, ?, 'sale', ?, ?, 0, ?, ?)`,
      generateId(), shopId, invoiceNumber, grandTotal, newBalance, createdAt,
    );
  });

  const saleItems: (SaleItem & { productName: string })[] = [];
  for (const item of items) {
    const product = await getProductById(item.productId);
    saleItems.push({
      id: generateId(),
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      rate: item.rate,
      total: item.quantity * item.rate,
      productName: product?.productName ?? '',
    });
  }

  return {
    id: saleId,
    invoiceNumber,
    shopId,
    subtotal,
    discount,
    grandTotal,
    profit,
    createdAt,
    shopName: shop.shopName,
    items: saleItems,
  };
}

export async function getSales(startDate?: string, endDate?: string, shopId?: string): Promise<(Sale & { shopName: string })[]> {
  const database = await getDatabase();
  let query = `SELECT s.*, sh.shopName FROM sales s JOIN shops sh ON s.shopId = sh.id WHERE 1=1`;
  const params: string[] = [];
  if (startDate) { query += ' AND s.createdAt >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND s.createdAt <= ?'; params.push(endDate); }
  if (shopId) { query += ' AND s.shopId = ?'; params.push(shopId); }
  query += ' ORDER BY s.createdAt DESC';
  return database.getAllAsync(query, ...params);
}

export async function getRecentSales(limit = 5): Promise<(Sale & { shopName: string })[]> {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT s.*, sh.shopName FROM sales s JOIN shops sh ON s.shopId = sh.id ORDER BY s.createdAt DESC LIMIT ?`,
    limit,
  );
}

// Payments
export async function createPayment(
  shopId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  notes: string,
  paymentDate: string,
): Promise<Payment & { shopName: string; receiptNumber: string }> {
  const database = await getDatabase();
  const shop = await getShopById(shopId);
  if (!shop) throw new Error('Shop not found');

  const id = generateId();
  const receiptNumber = `RCP-${Date.now()}`;

  await database.withTransactionAsync(async () => {
    await database!.runAsync(
      'INSERT INTO payments (id, shopId, amount, paymentMethod, notes, paymentDate) VALUES (?, ?, ?, ?, ?, ?)',
      id, shopId, amount, paymentMethod, notes, paymentDate,
    );

    const newBalance = Math.max(0, shop.outstandingBalance - amount);
    await database!.runAsync('UPDATE shops SET outstandingBalance = ? WHERE id = ?', newBalance, shopId);

    await database!.runAsync(
      `INSERT INTO ledgers (id, shopId, transactionType, referenceNumber, debit, credit, balance, createdAt)
       VALUES (?, ?, 'payment', ?, 0, ?, ?, ?)`,
      generateId(), shopId, receiptNumber, amount, newBalance, paymentDate,
    );
  });

  return { id, shopId, amount, paymentMethod, notes, paymentDate, shopName: shop.shopName, receiptNumber };
}

export async function getPayments(startDate?: string, endDate?: string, shopId?: string): Promise<(Payment & { shopName: string })[]> {
  const database = await getDatabase();
  let query = `SELECT p.*, sh.shopName FROM payments p JOIN shops sh ON p.shopId = sh.id WHERE 1=1`;
  const params: string[] = [];
  if (startDate) { query += ' AND p.paymentDate >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND p.paymentDate <= ?'; params.push(endDate); }
  if (shopId) { query += ' AND p.shopId = ?'; params.push(shopId); }
  query += ' ORDER BY p.paymentDate DESC';
  return database.getAllAsync(query, ...params);
}

export async function getRecentPayments(limit = 5): Promise<(Payment & { shopName: string })[]> {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT p.*, sh.shopName FROM payments p JOIN shops sh ON p.shopId = sh.id ORDER BY p.paymentDate DESC LIMIT ?`,
    limit,
  );
}

// Ledger
export async function getLedgerEntries(shopId: string, startDate?: string, endDate?: string): Promise<LedgerEntry[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM ledgers WHERE shopId = ?';
  const params: string[] = [shopId];
  if (startDate) { query += ' AND createdAt >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND createdAt <= ?'; params.push(endDate); }
  query += ' ORDER BY createdAt DESC';
  return database.getAllAsync<LedgerEntry>(query, ...params);
}

// Dashboard & Reports
export async function getDashboardStats(): Promise<DashboardStats> {
  const database = await getDatabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const totalShops = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM shops');
  const totalProducts = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products');

  const salesToday = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(grandTotal), 0) as total FROM sales WHERE createdAt >= ?', todayStart,
  );
  const salesMonth = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(grandTotal), 0) as total FROM sales WHERE createdAt >= ?', monthStart,
  );
  const salesYear = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(grandTotal), 0) as total FROM sales WHERE createdAt >= ?', yearStart,
  );

  const profitToday = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(profit), 0) as total FROM sales WHERE createdAt >= ?', todayStart,
  );
  const profitMonth = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(profit), 0) as total FROM sales WHERE createdAt >= ?', monthStart,
  );
  const profitYear = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(profit), 0) as total FROM sales WHERE createdAt >= ?', yearStart,
  );

  const outstanding = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(outstandingBalance), 0) as total FROM shops',
  );
  const payments = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM payments',
  );

  return {
    totalShops: totalShops?.count ?? 0,
    totalProducts: totalProducts?.count ?? 0,
    salesToday: salesToday?.total ?? 0,
    salesMonth: salesMonth?.total ?? 0,
    salesYear: salesYear?.total ?? 0,
    profitToday: profitToday?.total ?? 0,
    profitMonth: profitMonth?.total ?? 0,
    profitYear: profitYear?.total ?? 0,
    outstandingBalance: outstanding?.total ?? 0,
    paymentsCollected: payments?.total ?? 0,
  };
}

export async function getTopSellingProducts(limit = 5): Promise<{ productName: string; totalQuantity: number; totalRevenue: number }[]> {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT p.productName, SUM(si.quantity) as totalQuantity, SUM(si.total) as totalRevenue
     FROM sale_items si JOIN products p ON si.productId = p.id
     GROUP BY si.productId ORDER BY totalQuantity DESC LIMIT ?`,
    limit,
  );
}

export async function getMonthlyChartData(): Promise<{ month: string; sales: number; profit: number }[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ month: string; sales: number; profit: number }>(
    `SELECT strftime('%Y-%m', createdAt) as month,
            COALESCE(SUM(grandTotal), 0) as sales,
            COALESCE(SUM(profit), 0) as profit
     FROM sales
     WHERE createdAt >= date('now', '-11 months')
     GROUP BY strftime('%Y-%m', createdAt)
     ORDER BY month ASC`,
  );
  return rows;
}

export async function getLowStockProducts(threshold = 20): Promise<Product[]> {
  const database = await getDatabase();
  return database.getAllAsync<Product>(
    'SELECT * FROM products WHERE stockQuantity <= ? ORDER BY stockQuantity ASC',
    threshold,
  );
}

export async function getShopsWithHighOutstanding(threshold = 10000): Promise<Shop[]> {
  const database = await getDatabase();
  return database.getAllAsync<Shop>(
    'SELECT * FROM shops WHERE outstandingBalance >= ? ORDER BY outstandingBalance DESC',
    threshold,
  );
}

export async function exportAllData(): Promise<string> {
  const database = await getDatabase();
  const data = {
    products: await database.getAllAsync('SELECT * FROM products'),
    shops: await database.getAllAsync('SELECT * FROM shops'),
    sales: await database.getAllAsync('SELECT * FROM sales'),
    saleItems: await database.getAllAsync('SELECT * FROM sale_items'),
    payments: await database.getAllAsync('SELECT * FROM payments'),
    ledgers: await database.getAllAsync('SELECT * FROM ledgers'),
    exportedAt: toISOString(),
  };
  return JSON.stringify(data, null, 2);
}
