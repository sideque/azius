import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebase";

import {
  CartItem,
  DashboardStats,
  LedgerEntry,
  Payment,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  SaleWithDetails,
  PaymentWithShop,
  Shop,
  User,
} from "../types";

import {
  generateId,
  generateInvoiceNumber,
  toISOString,
} from "../utils/formatters";

const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const shopsCollection = collection(db, "shops");
const salesCollection = collection(db, "sales");
const saleItemsCollection = collection(db, "sale_items");
const paymentsCollection = collection(db, "payments");
const ledgersCollection = collection(db, "ledgers");
const cartsCollection = collection(db, "carts");

let initialized = false;

export async function getDatabase(): Promise<void> {
  if (!initialized) {
    await ensureSeedData();
    initialized = true;
  }
}

async function ensureSeedData() {
  const snapshot = await getDocs(query(usersCollection, limit(1)));
  if (!snapshot.empty) return;
  await seedDatabase();
}

async function seedDatabase() {
  const now = toISOString();
  const adminId = generateId();
  const salesId = generateId();

  await setDoc(doc(usersCollection, adminId), {
    id: adminId,
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Administrator",
    email: "",
  });

  await setDoc(doc(usersCollection, salesId), {
    id: salesId,
    username: "sales",
    password: "sales123",
    role: "sales",
    name: "Sales Representative",
    email: "",
  });

  const products = [
    {
      name: "Premium Rice 25kg",
      code: "PR-001",
      category: "Grains",
      purchase: 850,
      selling: 950,
      stock: 100,
      unit: "Bag",
    },
    {
      name: "Sunflower Oil 1L",
      code: "SO-001",
      category: "Oil",
      purchase: 120,
      selling: 145,
      stock: 200,
      unit: "Bottle",
    },
    {
      name: "Sugar 1kg",
      code: "SG-001",
      category: "Grocery",
      purchase: 42,
      selling: 50,
      stock: 500,
      unit: "Pack",
    },
    {
      name: "Wheat Flour 10kg",
      code: "WF-001",
      category: "Grains",
      purchase: 320,
      selling: 380,
      stock: 80,
      unit: "Bag",
    },
    {
      name: "Tea Powder 500g",
      code: "TP-001",
      category: "Beverages",
      purchase: 180,
      selling: 220,
      stock: 150,
      unit: "Pack",
    },
  ];

  for (const item of products) {
    await setDoc(doc(productsCollection, generateId()), {
      id: generateId(),
      productName: item.name,
      productCode: item.code,
      category: item.category,
      purchasePrice: item.purchase,
      sellingPrice: item.selling,
      stockQuantity: item.stock,
      unit: item.unit,
      description: "",
      createdAt: now,
    });
  }

  const shops = [
    {
      name: "Raj General Store",
      owner: "Raj Kumar",
      phone: "9876543210",
      address: "123 Main Street, Delhi",
      credit: 50000,
    },
    {
      name: "Sharma Kirana",
      owner: "Amit Sharma",
      phone: "9876543211",
      address: "45 Market Road, Mumbai",
      credit: 30000,
    },
    {
      name: "City Mart",
      owner: "Priya Singh",
      phone: "9876543212",
      address: "78 Park Avenue, Bangalore",
      credit: 75000,
    },
  ];

  for (const shop of shops) {
    await setDoc(doc(shopsCollection, generateId()), {
      id: generateId(),
      shopName: shop.name,
      ownerName: shop.owner,
      phoneNumber: shop.phone,
      address: shop.address,
      creditLimit: shop.credit,
      outstandingBalance: 0,
      notes: "",
      createdAt: now,
    });
  }
}

function mapDoc<T>(docSnap: any): T {
  return { id: docSnap.id, ...(docSnap.data() as T) } as T;
}

// Auth
export async function authenticateUser(
  username: string,
  password: string,
): Promise<User | null> {
  const q = query(
    usersCollection,
    where("username", "==", username.trim()),
    where("password", "==", password),
    limit(1),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDoc<User>(snapshot.docs[0]);
}

export async function getUserById(id: string): Promise<User | null> {
  const snapshot = await getDoc(doc(usersCollection, id));
  return snapshot.exists() ? mapDoc<User>(snapshot) : null;
}

export async function updateUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  await updateDoc(doc(usersCollection, userId), { password: newPassword });
}

export async function updateUserProfile(
  userId: string,
  name: string,
  email: string,
): Promise<void> {
  await updateDoc(doc(usersCollection, userId), { name, email });
}

// Products
export async function getProducts(
  search?: string,
  category?: string,
): Promise<Product[]> {

  const snapshot = await getDocs(productsCollection);

  let products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];

  if (search) {
    const term = search.trim().toLowerCase();

    products = products.filter((product) => {
      const productName = product.productName?.toLowerCase() ?? "";
      const productCode = product.productCode?.toLowerCase() ?? "";
      const categoryName = product.category?.toLowerCase() ?? "";

      return (
        productName.includes(term) ||
        productCode.includes(term) ||
        categoryName.includes(term)
      );
    });
  }

  if (category && category !== "All") {
    products = products.filter(
      (product) => product.category === category
    );
  }

  return products.sort((a, b) =>
    (a.productName ?? "").localeCompare(b.productName ?? "")
  );
}

async function resolveProductDocument(id: string): Promise<{
  ref: ReturnType<typeof doc>;
  product: Product | null;
}> {
  const directRef = doc(productsCollection, id);
  const directSnapshot = await getDoc(directRef);
  if (directSnapshot.exists()) {
    return { ref: directRef, product: mapDoc<Product>(directSnapshot) };
  }

  const fallbackQuery = query(
    productsCollection,
    where("id", "==", id),
    limit(1),
  );
  const fallbackSnapshot = await getDocs(fallbackQuery);
  if (!fallbackSnapshot.empty) {
    const fallbackDoc = fallbackSnapshot.docs[0];
    return { ref: fallbackDoc.ref, product: mapDoc<Product>(fallbackDoc) };
  }

  return { ref: directRef, product: null };
}

export async function getProductById(id: string): Promise<Product | null> {
  const { product } = await resolveProductDocument(id);
  return product;
}

export async function createProduct(
  product: Omit<Product, "id" | "createdAt">,
): Promise<Product> {
  const id = generateId();
  const createdAt = toISOString();
  await setDoc(doc(productsCollection, id), {
    id,
    ...product,
    createdAt,
  });
  return { ...product, id, createdAt };
}

export async function updateProduct(
  id: string,
  product: Partial<Product>,
): Promise<void> {
  const payload: Partial<Product> = {};
  if (product.productName !== undefined)
    payload.productName = product.productName;
  if (product.productCode !== undefined)
    payload.productCode = product.productCode;
  if (product.category !== undefined) payload.category = product.category;
  if (product.purchasePrice !== undefined)
    payload.purchasePrice = product.purchasePrice;
  if (product.sellingPrice !== undefined)
    payload.sellingPrice = product.sellingPrice;
  if (product.stockQuantity !== undefined)
    payload.stockQuantity = product.stockQuantity;
  if (product.unit !== undefined) payload.unit = product.unit;
  if (product.description !== undefined)
    payload.description = product.description;

  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(productsCollection, id), payload);
}

export async function deleteProduct(id: string): Promise<void> {
  const { ref } = await resolveProductDocument(id);
  await deleteDoc(ref);
}

export async function getProductCategories(): Promise<string[]> {
  const snapshot = await getDocs(productsCollection);
  const categories = snapshot.docs.map(
    (docSnap) => (docSnap.data() as Product).category || "",
  );
  return Array.from(new Set(categories)).sort();
}

export async function getCart(userId: string): Promise<{
  cart: CartItem[];
  selectedShopId: string | null;
  discount: number;
}> {
  const snapshot = await getDoc(doc(cartsCollection, userId));
  if (!snapshot.exists()) {
    return { cart: [], selectedShopId: null, discount: 0 };
  }

  const data = snapshot.data() as {
    cart?: CartItem[];
    selectedShopId?: string | null;
    discount?: number;
  };

  return {
    cart: Array.isArray(data.cart) ? data.cart : [],
    selectedShopId: data.selectedShopId ?? null,
    discount: Number.isFinite(data.discount) ? data.discount! : 0,
  };
}

export async function saveCart(
  userId: string,
  cart: CartItem[],
  selectedShopId: string | null,
  discount: number,
): Promise<void> {
  await setDoc(doc(cartsCollection, userId), {
    userId,
    cart,
    selectedShopId,
    discount,
    updatedAt: toISOString(),
  });
}

export async function clearCartInDb(userId: string): Promise<void> {
  await setDoc(doc(cartsCollection, userId), {
    userId,
    cart: [],
    selectedShopId: null,
    discount: 0,
    updatedAt: toISOString(),
  });
}

// Shops
export async function getShops(search?: string): Promise<Shop[]> {
  const snapshot = await getDocs(shopsCollection);
  let shops = snapshot.docs.map(mapDoc<Shop>);

  if (search) {
    const term = search.trim().toLowerCase();
    shops = shops.filter((shop) => {
      const shopName = shop.shopName?.toLowerCase() ?? "";
      const ownerName = shop.ownerName?.toLowerCase() ?? "";
      const phoneNumber = shop.phoneNumber?.toLowerCase() ?? "";
      return (
        shopName.includes(term) ||
        ownerName.includes(term) ||
        phoneNumber.includes(term)
      );
    });
  }

  return shops.sort((a, b) =>
    (a.shopName ?? "").localeCompare(b.shopName ?? ""),
  );
}

async function resolveShopDocument(id: string): Promise<{
  ref: ReturnType<typeof doc>;
  shop: Shop | null;
}> {
  const directRef = doc(shopsCollection, id);
  const directSnapshot = await getDoc(directRef);
  if (directSnapshot.exists()) {
    return { ref: directRef, shop: mapDoc<Shop>(directSnapshot) };
  }

  const fallbackQuery = query(shopsCollection, where("id", "==", id), limit(1));
  const fallbackSnapshot = await getDocs(fallbackQuery);
  if (!fallbackSnapshot.empty) {
    const fallbackDoc = fallbackSnapshot.docs[0];
    return { ref: fallbackDoc.ref, shop: mapDoc<Shop>(fallbackDoc) };
  }

  return { ref: directRef, shop: null };
}

export async function getShopById(id: string): Promise<Shop | null> {
  const { shop } = await resolveShopDocument(id);
  return shop;
}

export async function createShop(
  shop: Omit<Shop, "id" | "outstandingBalance" | "createdAt">,
): Promise<Shop> {
  const id = generateId();
  const createdAt = toISOString();
  await setDoc(doc(shopsCollection, id), {
    id,
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    phoneNumber: shop.phoneNumber,
    address: shop.address,
    creditLimit: shop.creditLimit,
    outstandingBalance: 0,
    notes: shop.notes,
    createdAt,
  });
  return { ...shop, id, outstandingBalance: 0, createdAt };
}

export async function updateShop(
  id: string,
  shop: Partial<Shop>,
): Promise<void> {
  const payload: Partial<Shop> = {};
  if (shop.shopName !== undefined) payload.shopName = shop.shopName;
  if (shop.ownerName !== undefined) payload.ownerName = shop.ownerName;
  if (shop.phoneNumber !== undefined) payload.phoneNumber = shop.phoneNumber;
  if (shop.address !== undefined) payload.address = shop.address;
  if (shop.creditLimit !== undefined) payload.creditLimit = shop.creditLimit;
  if (shop.notes !== undefined) payload.notes = shop.notes;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(shopsCollection, id), payload);
}

export async function deleteShop(id: string): Promise<void> {
  await deleteDoc(doc(shopsCollection, id));
}

// Sales
export async function createSale(
  shopId: string,
  items: {
    productId: string;
    quantity: number;
    rate: number;
    purchasePrice: number;
  }[],
  discount: number,
): Promise<SaleWithDetails> {
  const saleId = generateId();
  const invoiceNumber = generateInvoiceNumber();
  const createdAt = toISOString();
  const saleItems: SaleItem[] = [];
  const productSnapshotMap: Record<string, Product> = {};

  const { ref: shopRef, shop: resolvedShop } =
    await resolveShopDocument(shopId);
  if (!resolvedShop) throw new Error("Shop not found");

  const resolvedShopId = resolvedShop.id;

  await runTransaction(db, async (transaction) => {
    const shopSnap = await transaction.get(shopRef);
    if (!shopSnap.exists()) throw new Error("Shop not found");
    const shopData = shopSnap.data() as Shop;

    const productSnapshots = await Promise.all(
      items.map((item) =>
        transaction.get(doc(productsCollection, item.productId)),
      ),
    );

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const productSnap = productSnapshots[i];
      if (!productSnap.exists()) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      const product = productSnap.data() as Product;
      const normalizedQuantity = Number(item.quantity) || 0;
      const availableStock = Number(product.stockQuantity) || 0;
      const normalizedRate = Number(item.rate) || 0;
      const normalizedPurchasePrice = Number(item.purchasePrice) || 0;

      if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
        throw new Error("Each item must have a valid quantity");
      }

      productSnapshotMap[item.productId] = {
        ...product,
        stockQuantity: availableStock,
        purchasePrice: normalizedPurchasePrice,
        sellingPrice: normalizedRate,
      };

      if (normalizedQuantity > availableStock) {
        throw new Error(
          `Insufficient stock for ${product.productName}. Available: ${availableStock}`,
        );
      }
    }

    const normalizedDiscount = Number(discount) || 0;
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.rate),
      0,
    );
    const grandTotal = Math.max(0, subtotal - normalizedDiscount);
    const itemProfit = items.reduce(
      (sum, item) =>
        sum +
        (Number(item.rate) - Number(item.purchasePrice)) *
          Number(item.quantity),
      0,
    );
    const profit =
      subtotal > 0 ? itemProfit * (grandTotal / subtotal) : itemProfit;
    const currentOutstandingBalance = Number(shopData.outstandingBalance) || 0;
    const newBalance = currentOutstandingBalance + grandTotal;

    transaction.set(doc(salesCollection, saleId), {
      id: saleId,
      invoiceNumber,
      shopId: resolvedShopId,
      subtotal,
      discount,
      grandTotal,
      profit,
      createdAt,
    });

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const productSnap = productSnapshots[i];
      if (!productSnap.exists()) {
        continue;
      }
      const product = productSnap.data() as Product;
      const normalizedQuantity = Number(item.quantity) || 0;
      const normalizedRate = Number(item.rate) || 0;
      const itemId = generateId();
      const total = normalizedQuantity * normalizedRate;
      transaction.set(doc(saleItemsCollection, itemId), {
        id: itemId,
        saleId,
        productId: item.productId,
        quantity: normalizedQuantity,
        rate: normalizedRate,
        total,
      });
      const currentStock = Number(product.stockQuantity) || 0;
      transaction.update(doc(productsCollection, item.productId), {
        stockQuantity: Math.max(0, currentStock - normalizedQuantity),
      });
      saleItems.push({
        id: itemId,
        saleId,
        productId: item.productId,
        quantity: normalizedQuantity,
        rate: normalizedRate,
        total,
      });
    }

    transaction.update(shopRef, { outstandingBalance: newBalance });
    transaction.set(doc(ledgersCollection, generateId()), {
      id: generateId(),
      shopId: resolvedShopId,
      transactionType: "sale",
      referenceNumber: invoiceNumber,
      debit: grandTotal,
      credit: 0,
      balance: newBalance,
      createdAt,
    });
  });

  const persistedShop = await getShopById(shopId);
  const shopName = persistedShop?.shopName ?? "";
  const saleItemsWithName = await Promise.all(
    saleItems.map(async (item) => {
      const product = await getProductById(item.productId);
      return {
        ...item,
        productName: product?.productName ?? "",
      };
    }),
  );

  return {
    id: saleId,
    invoiceNumber,
    shopId: resolvedShopId,
    subtotal: saleItems.reduce((sum, item) => sum + item.total, 0),
    discount,
    grandTotal: saleItems.reduce((sum, item) => sum + item.total, 0) - discount,
    profit: saleItemsWithName.reduce(
      (sum, item) =>
        sum +
        (item.rate - (productSnapshotMap[item.productId]?.purchasePrice ?? 0)) *
          item.quantity,
      0,
    ),
    createdAt,
    shopName,
    items: saleItemsWithName,
  };
}

// Monthly Chart Data
export async function getMonthlyChartData(): Promise<{ month: string; sales: number; profit: number }[]> {
  const snapshot = await getDocs(salesCollection);
  const salesDocs = snapshot.docs.map(mapDoc<Sale>);

  const monthMap = new Map<string, { sales: number; profit: number }>();

  for (const sale of salesDocs) {
    if (!sale.createdAt) continue;
    const month = sale.createdAt.slice(0, 7); // e.g. "2024-06"
    const existing = monthMap.get(month) ?? { sales: 0, profit: 0 };
    monthMap.set(month, {
      sales: existing.sales + (Number(sale.grandTotal) || 0),
      profit: existing.profit + (Number(sale.profit) || 0),
    });
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sales, profit }]) => ({ month, sales, profit }));
}

// Recent Sales
export async function getRecentSales(limitNum: number): Promise<SaleWithDetails[]> {
  // Query the most recent sales ordered by creation timestamp
  const recentSalesQuery = query(salesCollection, orderBy('createdAt', 'desc'), limit(limitNum));
  const salesSnap = await getDocs(recentSalesQuery);

  const results: SaleWithDetails[] = [];
  for (const saleDoc of salesSnap.docs) {
    const sale = mapDoc<Sale>(saleDoc);
    // Fetch associated sale items
    const itemsSnap = await getDocs(query(saleItemsCollection, where('saleId', '==', sale.id)));
    const rawItems = itemsSnap.docs.map(mapDoc<SaleItem>);

    // Enrich items with product name
    const enrichedItems = await Promise.all(
      rawItems.map(async (item) => {
        const product = await getProductById(item.productId);
        return { ...item, productName: product?.productName ?? '' } as SaleItem & { productName: string };
      }),
    );

    // Compute totals and profit
    const subtotal = enrichedItems.reduce((sum, it) => sum + (it.total ?? 0), 0);
    const discount = (sale as any).discount ?? 0;
    const grandTotal = subtotal - discount;
    // Compute profit using purchase price from each product
    const profit = await Promise.all(enrichedItems.map(async (it) => {
      const prod = await getProductById(it.productId);
      const purchasePrice = prod?.purchasePrice ?? 0;
      return (it.rate - purchasePrice) * it.quantity;
    })).then(vals => vals.reduce((sum, v) => sum + v, 0));

    // Resolve shop name
    const shop = await getShopById(sale.shopId);
    const shopName = shop?.shopName ?? '';

    results.push({
      id: sale.id,
      invoiceNumber: (sale as any).invoiceNumber ?? '',
      shopId: sale.shopId,
      subtotal,
      discount,
      grandTotal,
      profit,
      createdAt: sale.createdAt,
      shopName,
      items: enrichedItems,
    });
  }
  return results;
}


// Get Sales
export async function getSales(
  startDate?: string,
  endDate?: string,
  shopId?: string
): Promise<SaleWithDetails[]> {

  const sales = await getRecentSales(10000);

  return sales.filter((sale) => {

    let ok = true;

    if (shopId) {
      ok = ok && sale.shopId === shopId;
    }

    if (startDate) {
      ok = ok && sale.createdAt >= startDate;
    }

    if (endDate) {
      ok = ok && sale.createdAt <= endDate;
    }

    return ok;
  });

}

export async function getPayments(
  startDate?: string,
  endDate?: string,
  shopId?: string
): Promise<PaymentWithShop[]> {

  const snapshot = await getDocs(paymentsCollection);

  let payments = snapshot.docs.map(mapDoc<Payment>);

  if (shopId) {
    payments = payments.filter(p => p.shopId === shopId);
  }

  if (startDate) {
    payments = payments.filter(p => p.createdAt >= startDate);
  }

  if (endDate) {
    payments = payments.filter(p => p.createdAt <= endDate);
  }

  const sortedPayments = payments.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return Promise.all(
    sortedPayments.map(async (payment) => {
      const shop = await getShopById(payment.shopId);
      return {
        ...payment,
        shopName: shop?.shopName ?? "Unknown Shop",
      };
    })
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [shops, products, sales, payments] = await Promise.all([
    getShops(),
    getProducts(),
    getRecentSales(10000),
    getPayments(),
  ]);

  const now = new Date();

  const today = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);
  const year = now.getFullYear().toString();

  const salesToday = sales
    .filter((s) => s.createdAt.startsWith(today))
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const salesMonth = sales
    .filter((s) => s.createdAt.startsWith(month))
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const salesYear = sales
    .filter((s) => s.createdAt.startsWith(year))
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const profitToday = sales
    .filter((s) => s.createdAt.startsWith(today))
    .reduce((sum, s) => sum + s.profit, 0);

  const profitMonth = sales
    .filter((s) => s.createdAt.startsWith(month))
    .reduce((sum, s) => sum + s.profit, 0);

  const profitYear = sales
    .filter((s) => s.createdAt.startsWith(year))
    .reduce((sum, s) => sum + s.profit, 0);

  const outstandingBalance = shops.reduce(
    (sum, shop) => sum + (shop.outstandingBalance ?? 0),
    0
  );

  const paymentsCollected = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  return {
    totalShops: shops.length,
    totalProducts: products.length,
    salesToday,
    salesMonth,
    salesYear,
    profitToday,
    profitMonth,
    profitYear,
    outstandingBalance,
    paymentsCollected,
  };
}


export async function getTopSellingProducts() {
  const snapshot = await getDocs(saleItemsCollection);

  const saleItems = snapshot.docs.map(mapDoc<SaleItem>);

  const map = new Map<
    string,
    {
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
    }
  >();

  for (const item of saleItems) {
    const product = await getProductById(item.productId);

    const existing = map.get(item.productId) ?? {
      productName: product?.productName ?? "Unknown Product",
      totalQuantity: 0,
      totalRevenue: 0,
    };

    existing.totalQuantity += item.quantity;
    existing.totalRevenue += item.total;

    map.set(item.productId, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);
}


export async function getRecentPayments(limitNum: number): Promise<PaymentWithShop[]> {

  const q = query(
    paymentsCollection,
    orderBy("createdAt", "desc"),
    limit(limitNum)
  );

  const snapshot = await getDocs(q);

  const payments = snapshot.docs.map(mapDoc<Payment>);

  return Promise.all(
    payments.map(async (payment) => {
      const shop = await getShopById(payment.shopId);
      return {
        ...payment,
        shopName: shop?.shopName ?? "Unknown Shop",
      };
    })
  );
}



export async function getSaleByInvoiceNumber(invoiceNumber: string): Promise<SaleWithDetails | null> {
  const q = query(salesCollection, where("invoiceNumber", "==", invoiceNumber), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const sale = mapDoc<Sale>(snap.docs[0]);

  const itemsSnap = await getDocs(query(saleItemsCollection, where('saleId', '==', sale.id)));
  const rawItems = itemsSnap.docs.map(mapDoc<SaleItem>);

  const enrichedItems = await Promise.all(
    rawItems.map(async (item) => {
      const product = await getProductById(item.productId);
      return { ...item, productName: product?.productName ?? '' } as SaleItem & { productName: string };
    }),
  );

  const shop = await getShopById(sale.shopId);
  return {
    ...sale,
    shopName: shop?.shopName ?? '',
    items: enrichedItems
  };
}

export async function deleteSale(saleId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const saleRef = doc(salesCollection, saleId);
    const saleSnap = await transaction.get(saleRef);
    if (!saleSnap.exists()) throw new Error("Sale not found");
    const saleData = saleSnap.data() as Sale;

    const shopRef = doc(shopsCollection, saleData.shopId);
    const shopSnap = await transaction.get(shopRef);
    if (shopSnap.exists()) {
      const shopData = shopSnap.data() as Shop;
      const newBalance = Math.max(0, (shopData.outstandingBalance ?? 0) - saleData.grandTotal);
      transaction.update(shopRef, { outstandingBalance: newBalance });
    }

    const itemsSnap = await getDocs(query(saleItemsCollection, where('saleId', '==', saleId)));
    for (const itemDoc of itemsSnap.docs) {
      const itemData = itemDoc.data() as SaleItem;
      const productRef = doc(productsCollection, itemData.productId);
      const productSnap = await transaction.get(productRef);
      if (productSnap.exists()) {
         const currentStock = Number(productSnap.data().stockQuantity) || 0;
         transaction.update(productRef, { stockQuantity: currentStock + itemData.quantity });
      }
      transaction.delete(itemDoc.ref);
    }

    const ledgerSnap = await getDocs(query(ledgersCollection, where('referenceNumber', '==', saleData.invoiceNumber)));
    for (const lDoc of ledgerSnap.docs) {
      transaction.delete(lDoc.ref);
    }

    transaction.delete(saleRef);
  });
}

export async function getPaymentByReceiptNumber(receiptNumber: string): Promise<Payment & { shopName: string } | null> {
  const q = query(paymentsCollection, where("receiptNumber", "==", receiptNumber), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const payment = mapDoc<Payment>(snap.docs[0]);
  const shop = await getShopById(payment.shopId);
  return { ...payment, shopName: shop?.shopName ?? '' } as Payment & { shopName: string };
}

export async function deletePayment(paymentId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(paymentsCollection, paymentId);
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data() as Payment & { receiptNumber: string };

    const shopRef = doc(shopsCollection, paymentData.shopId);
    const shopSnap = await transaction.get(shopRef);
    if (shopSnap.exists()) {
      const shopData = shopSnap.data() as Shop;
      const newBalance = (shopData.outstandingBalance ?? 0) + paymentData.amount;
      transaction.update(shopRef, { outstandingBalance: newBalance });
    }

    const ledgerSnap = await getDocs(query(ledgersCollection, where('referenceNumber', '==', paymentData.receiptNumber || '')));
    for (const lDoc of ledgerSnap.docs) {
      transaction.delete(lDoc.ref);
    }

    transaction.delete(paymentRef);
  });
}

export async function updatePaymentData(
  paymentId: string,
  updates: { amount: number; paymentMethod: PaymentMethod; paymentDate: string; notes?: string }
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(paymentsCollection, paymentId);
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data() as Payment & { receiptNumber: string };

    const amountDiff = updates.amount - paymentData.amount;

    const shopRef = doc(shopsCollection, paymentData.shopId);
    const shopSnap = await transaction.get(shopRef);
    if (shopSnap.exists()) {
       const shopData = shopSnap.data() as Shop;
       const newBalance = Math.max(0, (shopData.outstandingBalance ?? 0) - amountDiff);
       transaction.update(shopRef, { outstandingBalance: newBalance });
    }

    transaction.update(paymentRef, updates);

    const ledgerSnap = await getDocs(query(ledgersCollection, where('referenceNumber', '==', paymentData.receiptNumber || '')));
    for (const lDoc of ledgerSnap.docs) {
      transaction.update(lDoc.ref, { credit: updates.amount });
    }
  });
}

export async function updateSaleData(
  saleId: string,
  updates: {
    items: {
      productId: string;
      quantity: number;
      rate: number;
      total: number;
    }[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    profit: number;
  }
): Promise<void> {

  // ---------- ALL READS ----------
  const saleRef = doc(salesCollection, saleId);
  const saleSnap = await getDoc(saleRef);

  if (!saleSnap.exists()) {
    throw new Error("Sale not found");
  }

  const oldSale = saleSnap.data() as Sale;

  const shopRef = doc(shopsCollection, oldSale.shopId);
  const shopSnap = await getDoc(shopRef);

  const oldItemsSnap = await getDocs(
    query(
      saleItemsCollection,
      where("saleId", "==", saleId)
    )
  );

  const ledgerSnap = await getDocs(
    query(
      ledgersCollection,
      where("referenceNumber", "==", oldSale.invoiceNumber)
    )
  );

  // Read ALL old products

  const oldProducts = await Promise.all(
    oldItemsSnap.docs.map(async (d) => {
      const item = d.data() as SaleItem;
      const ref = doc(productsCollection, item.productId);
      const snap = await getDoc(ref);

      return {
        ref,
        snap,
        item,
      };
    })
  );

  // Read ALL new products

  const newProducts = await Promise.all(
    updates.items.map(async (item) => {
      const ref = doc(productsCollection, item.productId);
      const snap = await getDoc(ref);

      return {
        ref,
        snap,
        item,
      };
    })
  );

  // ---------- TRANSACTION ----------

  await runTransaction(db, async (transaction) => {

    // Restore old stock

    for (const old of oldProducts) {

      if (!old.snap.exists()) continue;

      const stock =
        Number(old.snap.data().stockQuantity) || 0;

      transaction.update(old.ref, {
        stockQuantity: stock + old.item.quantity,
      });

      transaction.delete(
        doc(saleItemsCollection, old.item.id)
      );
    }

    // Deduct new stock

    for (const p of newProducts) {

      if (!p.snap.exists()) {
        throw new Error("Product not found");
      }

      const stock =
        Number(p.snap.data().stockQuantity) || 0;

      if (stock < p.item.quantity) {
        throw new Error("Insufficient stock");
      }

      transaction.update(p.ref, {
        stockQuantity: stock - p.item.quantity,
      });

      const newSaleItemRef = doc(saleItemsCollection);

      transaction.set(newSaleItemRef, {
        id: newSaleItemRef.id,
        saleId,
        productId: p.item.productId,
        quantity: p.item.quantity,
        rate: p.item.rate,
        total: p.item.total,
      });
    }

    // Update Sale

    transaction.update(saleRef, {
      subtotal: updates.subtotal,
      discount: updates.discount,
      grandTotal: updates.grandTotal,
      profit: updates.profit,
    });

    // Update Shop Balance

    if (shopSnap.exists()) {

      const shop = shopSnap.data() as Shop;

      const newBalance =
        (shop.outstandingBalance || 0)
        - oldSale.grandTotal
        + updates.grandTotal;

      transaction.update(shopRef, {
        outstandingBalance: newBalance,
      });
    }

    // Update Ledger

    ledgerSnap.docs.forEach((docSnap) => {

      transaction.update(docSnap.ref, {
        debit: updates.grandTotal,
      });

    });

  });
}

export async function getLedgerEntries(
  shopId?: string,
  startDate?: string,
  endDate?: string,
): Promise<LedgerEntry[]> {
  const snapshot = await getDocs(ledgersCollection);
  let entries = snapshot.docs.map(mapDoc<LedgerEntry>);

  if (shopId) {
    entries = entries.filter((entry) => entry.shopId === shopId);
  }

  if (startDate) {
    entries = entries.filter((entry) => entry.createdAt >= startDate);
  }

  if (endDate) {
    entries = entries.filter((entry) => entry.createdAt <= endDate);
  }

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}