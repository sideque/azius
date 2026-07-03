// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDoc,
//   getDocs,
//   limit,
//   orderBy,
//   query,
//   runTransaction,
//   setDoc,
//   updateDoc,
//   where,
// } from "firebase/firestore";

// import { db } from "../config/firebase";

// import {
//   CartItem,
//   DashboardStats,
//   LedgerEntry,
//   Payment,
//   PaymentMethod,
//   Product,
//   Sale,
//   SaleItem,
//   SaleWithDetails,
//   PaymentWithShop,
//   Shop,
//   Supplier,
//   SupplierPayment,
//   SupplierPaymentWithSupplier,
//   SupplierPurchaseBill,
//   SupplierBillItem,
//   User,
// } from "../types";

// import {
//   generateId,
//   generateInvoiceNumber,
//   generateReceiptNumber,
//   toISOString,
// } from "../utils/formatters";

// const usersCollection = collection(db, "users");
// const productsCollection = collection(db, "products");
// const shopsCollection = collection(db, "shops");
// const suppliersCollection = collection(db, "suppliers");
// const salesCollection = collection(db, "sales");
// const saleItemsCollection = collection(db, "sale_items");
// const paymentsCollection = collection(db, "payments");
// const supplierPaymentsCollection = collection(db, "supplier_payments");
// const supplierBillsCollection = collection(db, "supplier_bills");
// const ledgersCollection = collection(db, "ledgers");
// const cartsCollection = collection(db, "carts");

// let initialized = false;

// export async function getDatabase(): Promise<void> {
//   if (!initialized) {
//     await ensureSeedData();
//     initialized = true;
//   }
// }

// async function ensureSeedData() {
//   const snapshot = await getDocs(query(usersCollection, limit(1)));
//   if (!snapshot.empty) return;
//   // await seedDatabase();
// }

// async function seedDatabase() {
//   const now = toISOString();
//   const adminId = generateId();
//   const salesId = generateId();

//   await setDoc(doc(usersCollection, adminId), {
//     id: adminId,
//     username: "admin",
//     password: "admin123",
//     role: "admin",
//     name: "Administrator",
//     email: "",
//   });

//   await setDoc(doc(usersCollection, salesId), {
//     id: salesId,
//     username: "sales",
//     password: "sales123",
//     role: "sales",
//     name: "Sales Representative",
//     email: "",
//   });

//   const products = [
//     {
//       name: "Premium Rice 25kg",
//       code: "PR-001",
//       category: "Grains",
//       purchase: 850,
//       selling: 950,
//       stock: 100,
//       unit: "Bag",
//     },
//     {
//       name: "Sunflower Oil 1L",
//       code: "SO-001",
//       category: "Oil",
//       purchase: 120,
//       selling: 145,
//       stock: 200,
//       unit: "Bottle",
//     },
//     {
//       name: "Sugar 1kg",
//       code: "SG-001",
//       category: "Grocery",
//       purchase: 42,
//       selling: 50,
//       stock: 500,
//       unit: "Pack",
//     },
//     {
//       name: "Wheat Flour 10kg",
//       code: "WF-001",
//       category: "Grains",
//       purchase: 320,
//       selling: 380,
//       stock: 80,
//       unit: "Bag",
//     },
//     {
//       name: "Tea Powder 500g",
//       code: "TP-001",
//       category: "Beverages",
//       purchase: 180,
//       selling: 220,
//       stock: 150,
//       unit: "Pack",
//     },
//   ];

//   for (const item of products) {
//     await setDoc(doc(productsCollection, generateId()), {
//       id: generateId(),
//       productName: item.name,
//       productCode: item.code,
//       category: item.category,
//       purchasePrice: item.purchase,
//       sellingPrice: item.selling,
//       stockQuantity: item.stock,
//       unit: item.unit,
//       description: "",
//       createdAt: now,
//     });
//   }

//   const shops = [
//     {
//       name: "Raj General Store",
//       owner: "Raj Kumar",
//       phone: "9876543210",
//       address: "123 Main Street, Delhi",
//       credit: 50000,
//     },
//     {
//       name: "Sharma Kirana",
//       owner: "Amit Sharma",
//       phone: "9876543211",
//       address: "45 Market Road, Mumbai",
//       credit: 30000,
//     },
//     {
//       name: "City Mart",
//       owner: "Priya Singh",
//       phone: "9876543212",
//       address: "78 Park Avenue, Bangalore",
//       credit: 75000,
//     },
//   ];

//   for (const shop of shops) {
//     await setDoc(doc(shopsCollection, generateId()), {
//       id: generateId(),
//       shopName: shop.name,
//       ownerName: shop.owner,
//       phoneNumber: shop.phone,
//       address: shop.address,
//       creditLimit: shop.credit,
//       outstandingBalance: 0,
//       notes: "",
//       createdAt: now,
//     });
//   }
// }

// function mapDoc<T>(docSnap: any): T {
//   return { id: docSnap.id, ...(docSnap.data() as T) } as T;
// }

// // Auth
// export async function authenticateUser(
//   username: string,
//   password: string,
// ): Promise<User | null> {
//   const q = query(
//     usersCollection,
//     where("username", "==", username.trim()),
//     where("password", "==", password),
//     limit(1),
//   );
//   const snapshot = await getDocs(q);
//   if (snapshot.empty) return null;
//   return mapDoc<User>(snapshot.docs[0]);
// }

// export async function getUserById(id: string): Promise<User | null> {
//   const snapshot = await getDoc(doc(usersCollection, id));
//   return snapshot.exists() ? mapDoc<User>(snapshot) : null;
// }

// export async function updateUserPassword(
//   userId: string,
//   newPassword: string,
// ): Promise<void> {
//   await updateDoc(doc(usersCollection, userId), { password: newPassword });
// }

// export async function updateUserProfile(
//   userId: string,
//   name: string,
//   email: string,
// ): Promise<void> {
//   await updateDoc(doc(usersCollection, userId), { name, email });
// }

// // Products
// export async function getProducts(
//   search?: string,
//   category?: string,
// ): Promise<Product[]> {
//   const snapshot = await getDocs(productsCollection);

//   let products = snapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as Product[];

//   if (search) {
//     const term = search.trim().toLowerCase();

//     products = products.filter((product) => {
//       const productName = product.productName?.toLowerCase() ?? "";
//       const productCode = product.productCode?.toLowerCase() ?? "";
//       const categoryName = product.category?.toLowerCase() ?? "";

//       return (
//         productName.includes(term) ||
//         productCode.includes(term) ||
//         categoryName.includes(term)
//       );
//     });
//   }

//   if (category && category !== "All") {
//     products = products.filter((product) => product.category === category);
//   }

//   return products.sort((a, b) =>
//     (a.productName ?? "").localeCompare(b.productName ?? ""),
//   );
// }

// async function resolveProductDocument(id: string): Promise<{
//   ref: ReturnType<typeof doc>;
//   product: Product | null;
// }> {
//   const directRef = doc(productsCollection, id);
//   const directSnapshot = await getDoc(directRef);
//   if (directSnapshot.exists()) {
//     return { ref: directRef, product: mapDoc<Product>(directSnapshot) };
//   }

//   const fallbackQuery = query(
//     productsCollection,
//     where("id", "==", id),
//     limit(1),
//   );
//   const fallbackSnapshot = await getDocs(fallbackQuery);
//   if (!fallbackSnapshot.empty) {
//     const fallbackDoc = fallbackSnapshot.docs[0];
//     return { ref: fallbackDoc.ref, product: mapDoc<Product>(fallbackDoc) };
//   }

//   return { ref: directRef, product: null };
// }

// export async function getProductById(id: string): Promise<Product | null> {
//   const { product } = await resolveProductDocument(id);
//   return product;
// }

// export async function createProduct(
//   product: Omit<Product, "id" | "createdAt">,
// ): Promise<Product> {
//   const id = generateId();
//   const createdAt = toISOString();
//   await setDoc(doc(productsCollection, id), {
//     id,
//     ...product,
//     createdAt,
//   });
//   return { ...product, id, createdAt };
// }

// export async function updateProduct(
//   id: string,
//   product: Partial<Product>,
// ): Promise<void> {
//   const payload: Partial<Product> = {};
//   if (product.productName !== undefined)
//     payload.productName = product.productName;
//   if (product.productCode !== undefined)
//     payload.productCode = product.productCode;
//   if (product.category !== undefined) payload.category = product.category;
//   if (product.purchasePrice !== undefined)
//     payload.purchasePrice = product.purchasePrice;
//   if (product.sellingPrice !== undefined)
//     payload.sellingPrice = product.sellingPrice;
//   if (product.stockQuantity !== undefined)
//     payload.stockQuantity = product.stockQuantity;
//   if (product.unit !== undefined) payload.unit = product.unit;
//   if (product.supplierId !== undefined) payload.supplierId = product.supplierId;
//   if (product.supplierName !== undefined)
//     payload.supplierName = product.supplierName;
//   if (product.description !== undefined)
//     payload.description = product.description;

//   if (Object.keys(payload).length === 0) return;
//   await updateDoc(doc(productsCollection, id), payload);
// }

// export async function deleteProduct(id: string): Promise<void> {
//   const { ref } = await resolveProductDocument(id);
//   await deleteDoc(ref);
// }

// export async function getProductCategories(): Promise<string[]> {
//   const snapshot = await getDocs(productsCollection);
//   const categories = snapshot.docs.map(
//     (docSnap) => (docSnap.data() as Product).category || "",
//   );
//   return Array.from(new Set(categories)).sort();
// }

// export async function getCart(userId: string): Promise<{
//   cart: CartItem[];
//   selectedShopId: string | null;
//   discount: number;
// }> {
//   const snapshot = await getDoc(doc(cartsCollection, userId));
//   if (!snapshot.exists()) {
//     return { cart: [], selectedShopId: null, discount: 0 };
//   }

//   const data = snapshot.data() as {
//     cart?: CartItem[];
//     selectedShopId?: string | null;
//     discount?: number;
//   };

//   return {
//     cart: Array.isArray(data.cart) ? data.cart : [],
//     selectedShopId: data.selectedShopId ?? null,
//     discount: Number.isFinite(data.discount) ? data.discount! : 0,
//   };
// }

// export async function saveCart(
//   userId: string,
//   cart: CartItem[],
//   selectedShopId: string | null,
//   discount: number,
// ): Promise<void> {
//   await setDoc(doc(cartsCollection, userId), {
//     userId,
//     cart,
//     selectedShopId,
//     discount,
//     updatedAt: toISOString(),
//   });
// }

// export async function clearCartInDb(userId: string): Promise<void> {
//   await setDoc(doc(cartsCollection, userId), {
//     userId,
//     cart: [],
//     selectedShopId: null,
//     discount: 0,
//     updatedAt: toISOString(),
//   });
// }

// // Shops
// export async function getShops(search?: string): Promise<Shop[]> {
//   const snapshot = await getDocs(shopsCollection);
//   let shops = snapshot.docs.map(mapDoc<Shop>);

//   if (search) {
//     const term = search.trim().toLowerCase();
//     shops = shops.filter((shop) => {
//       const shopName = shop.shopName?.toLowerCase() ?? "";
//       const ownerName = shop.ownerName?.toLowerCase() ?? "";
//       const phoneNumber = shop.phoneNumber?.toLowerCase() ?? "";
//       return (
//         shopName.includes(term) ||
//         ownerName.includes(term) ||
//         phoneNumber.includes(term)
//       );
//     });
//   }

//   return shops.sort((a, b) =>
//     (a.shopName ?? "").localeCompare(b.shopName ?? ""),
//   );
// }

// async function resolveShopDocument(id: string): Promise<{
//   ref: ReturnType<typeof doc>;
//   shop: Shop | null;
// }> {
//   const directRef = doc(shopsCollection, id);
//   const directSnapshot = await getDoc(directRef);
//   if (directSnapshot.exists()) {
//     return { ref: directRef, shop: mapDoc<Shop>(directSnapshot) };
//   }

//   const fallbackQuery = query(shopsCollection, where("id", "==", id), limit(1));
//   const fallbackSnapshot = await getDocs(fallbackQuery);
//   if (!fallbackSnapshot.empty) {
//     const fallbackDoc = fallbackSnapshot.docs[0];
//     return { ref: fallbackDoc.ref, shop: mapDoc<Shop>(fallbackDoc) };
//   }

//   return { ref: directRef, shop: null };
// }

// export async function getShopById(id: string): Promise<Shop | null> {
//   const { shop } = await resolveShopDocument(id);
//   return shop;
// }

// export async function createShop(
//   shop: Omit<Shop, "id" | "createdAt">,
// ): Promise<Shop> {
//   const id = generateId();
//   const createdAt = toISOString();
//   const outstandingBalance = shop.outstandingBalance ?? 0;
//   await setDoc(doc(shopsCollection, id), {
//     id,
//     shopName: shop.shopName,
//     ownerName: shop.ownerName,
//     phoneNumber: shop.phoneNumber,
//     address: shop.address,
//     creditLimit: shop.creditLimit,
//     outstandingBalance,
//     openingBalance: shop.openingBalance ?? outstandingBalance,
//     notes: shop.notes,
//     createdAt,
//   });
//   return { ...shop, id, outstandingBalance, createdAt };
// }

// export async function updateShop(
//   id: string,
//   shop: Partial<Shop>,
// ): Promise<void> {
//   const payload: Partial<Shop> = {};
//   if (shop.shopName !== undefined) payload.shopName = shop.shopName;
//   if (shop.ownerName !== undefined) payload.ownerName = shop.ownerName;
//   if (shop.phoneNumber !== undefined) payload.phoneNumber = shop.phoneNumber;
//   if (shop.address !== undefined) payload.address = shop.address;
//   if (shop.creditLimit !== undefined) payload.creditLimit = shop.creditLimit;
//   if (shop.notes !== undefined) payload.notes = shop.notes;
//   if (shop.openingBalance !== undefined)
//     payload.openingBalance = shop.openingBalance;
//   if (shop.outstandingBalance !== undefined)
//     payload.outstandingBalance = shop.outstandingBalance;
//   if (Object.keys(payload).length === 0) return;
//   await updateDoc(doc(shopsCollection, id), payload);
// }

// export async function deleteShop(id: string): Promise<void> {
//   await deleteDoc(doc(shopsCollection, id));
// }

// export async function getSuppliers(search?: string): Promise<Supplier[]> {
//   const snapshot = await getDocs(suppliersCollection);
//   let suppliers = snapshot.docs.map(mapDoc<Supplier>);

//   if (search) {
//     const term = search.trim().toLowerCase();
//     suppliers = suppliers.filter((supplier) => {
//       const supplierName = supplier.supplierName?.toLowerCase() ?? "";
//       const contactName = supplier.contactName?.toLowerCase() ?? "";
//       const phoneNumber = supplier.phoneNumber?.toLowerCase() ?? "";
//       return (
//         supplierName.includes(term) ||
//         contactName.includes(term) ||
//         phoneNumber.includes(term)
//       );
//     });
//   }

//   return suppliers.sort((a, b) =>
//     (a.supplierName ?? "").localeCompare(b.supplierName ?? ""),
//   );
// }

// export async function getSupplierById(id: string): Promise<Supplier | null> {
//   const snapshot = await getDoc(doc(suppliersCollection, id));
//   return snapshot.exists() ? mapDoc<Supplier>(snapshot) : null;
// }

// export async function createSupplier(
//   supplier: Omit<Supplier, "id" | "createdAt">,
// ): Promise<Supplier> {
//   const id = generateId();
//   const createdAt = toISOString();
//   const outstandingBalance = supplier.outstandingBalance ?? 0;
//   await setDoc(doc(suppliersCollection, id), {
//     id,
//     ...supplier,
//     createdAt,
//     outstandingBalance,
//     openingBalance: supplier.openingBalance ?? outstandingBalance,
//   });
//   return { ...supplier, id, createdAt, outstandingBalance };
// }

// export async function updateSupplier(
//   id: string,
//   supplier: Partial<Supplier>,
// ): Promise<void> {
//   const payload: Partial<Supplier> = {};
//   if (supplier.supplierName !== undefined)
//     payload.supplierName = supplier.supplierName;
//   if (supplier.contactName !== undefined)
//     payload.contactName = supplier.contactName;
//   if (supplier.phoneNumber !== undefined)
//     payload.phoneNumber = supplier.phoneNumber;
//   if (supplier.address !== undefined) payload.address = supplier.address;
//   if (supplier.notes !== undefined) payload.notes = supplier.notes;
//   if (supplier.openingBalance !== undefined)
//     payload.openingBalance = supplier.openingBalance;
//   if (supplier.outstandingBalance !== undefined)
//     payload.outstandingBalance = supplier.outstandingBalance;
//   if (Object.keys(payload).length === 0) return;
//   await updateDoc(doc(suppliersCollection, id), payload);
// }

// export async function deleteSupplier(id: string): Promise<void> {
//   await deleteDoc(doc(suppliersCollection, id));
// }

// export async function createSupplierBill(
//   supplierId: string,
//   supplierName: string,
//   items: SupplierBillItem[],
//   billDate: string,
//   notes: string,
// ): Promise<SupplierPurchaseBill> {
//   const id = generateId();
//   const billNumber = `BILL-${Date.now()}`;
//   const createdAt = toISOString();
//   const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

//   await runTransaction(db, async (transaction) => {
//     const supplierRef = doc(suppliersCollection, supplierId);
//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const currentBalance = supplierData.outstandingBalance ?? 0;
//     const newBalance = currentBalance + totalAmount;

//     transaction.set(doc(supplierBillsCollection, id), {
//       id,
//       supplierId,
//       supplierName,
//       billNumber,
//       billDate,
//       notes,
//       totalAmount,
//       items,
//       createdAt,
//     });
//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//   });

//   return {
//     id,
//     supplierId,
//     supplierName,
//     billNumber,
//     billDate,
//     notes,
//     totalAmount,
//     items,
//     createdAt,
//   };
// }

// export async function createOrUpdateSupplierBill(
//   supplierId: string,
//   supplierName: string,
//   items: SupplierBillItem[],
//   billDate: string,
//   notes: string,
// ): Promise<SupplierPurchaseBill> {
//   const normalizedDay = billDate.split("T")[0];
//   const existingBills = await getSupplierBills(supplierId);
//   const existingBill = existingBills.find(
//     (bill) => bill.billDate.split("T")[0] === normalizedDay,
//   );

//   if (!existingBill) {
//     return createSupplierBill(supplierId, supplierName, items, billDate, notes);
//   }

//   const updatedItemsMap = new Map(
//     existingBill.items.map((item) => [item.productId, { ...item }]),
//   );
//   items.forEach((item) => {
//     const existingItem = updatedItemsMap.get(item.productId);
//     if (existingItem) {
//       const combinedQuantity = existingItem.quantity + item.quantity;
//       const combinedTotal = existingItem.total + item.total;
//       existingItem.quantity = combinedQuantity;
//       existingItem.total = combinedTotal;
//       existingItem.purchasePrice =
//         combinedQuantity > 0
//           ? combinedTotal / combinedQuantity
//           : item.purchasePrice;
//       updatedItemsMap.set(item.productId, existingItem);
//     } else {
//       updatedItemsMap.set(item.productId, { ...item });
//     }
//   });

//   const updatedItems = Array.from(updatedItemsMap.values());
//   const updatedTotalAmount = updatedItems.reduce(
//     (sum, item) => sum + item.total,
//     0,
//   );
//   const noteText = [existingBill.notes, notes].filter(Boolean).join(" | ");

//   await runTransaction(db, async (transaction) => {
//     const billRef = doc(supplierBillsCollection, existingBill.id);
//     const supplierRef = doc(suppliersCollection, supplierId);

//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const currentBalance = supplierData.outstandingBalance ?? 0;
//     const newBalance =
//       currentBalance + (updatedTotalAmount - existingBill.totalAmount);

//     transaction.update(billRef, {
//       items: updatedItems,
//       totalAmount: updatedTotalAmount,
//       notes: noteText,
//     });
//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//   });

//   return {
//     ...existingBill,
//     items: updatedItems,
//     totalAmount: updatedTotalAmount,
//     notes: noteText,
//   };
// }

// export async function getSupplierBills(
//   supplierId?: string,
//   startDate?: string,
//   endDate?: string,
// ): Promise<SupplierPurchaseBill[]> {
//   const snapshot = await getDocs(supplierBillsCollection);
//   let bills = snapshot.docs.map(mapDoc<SupplierPurchaseBill>);

//   if (supplierId) {
//     bills = bills.filter((bill) => bill.supplierId === supplierId);
//   }
//   if (startDate) {
//     bills = bills.filter((bill) => bill.billDate >= startDate);
//   }
//   if (endDate) {
//     bills = bills.filter((bill) => bill.billDate <= endDate);
//   }

//   return bills.sort((a, b) => b.billDate.localeCompare(a.billDate));
// }

// export async function getSupplierBill(
//   billId: string,
// ): Promise<SupplierPurchaseBill | null> {
//   const billSnap = await getDoc(doc(supplierBillsCollection, billId));
//   return billSnap.exists() ? mapDoc<SupplierPurchaseBill>(billSnap) : null;
// }

// export async function updateSupplierBillData(
//   billId: string,
//   updates: {
//     items?: SupplierBillItem[];
//     notes?: string;
//     billDate?: string;
//     totalAmount?: number;
//   },
// ): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const billRef = doc(supplierBillsCollection, billId);
//     const billSnap = await transaction.get(billRef);
//     if (!billSnap.exists()) throw new Error("Bill not found");

//     const billData = billSnap.data() as SupplierPurchaseBill;
//     const oldTotal = billData.totalAmount;
//     const newTotal = updates.totalAmount ?? oldTotal;
//     const delta = newTotal - oldTotal;

//     const supplierRef = doc(suppliersCollection, billData.supplierId);
//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const currentBalance = supplierData.outstandingBalance ?? 0;
//     const newBalance = Math.max(0, currentBalance + delta);

//     transaction.update(billRef, {
//       ...(updates.items !== undefined ? { items: updates.items } : {}),
//       ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
//       ...(updates.billDate !== undefined ? { billDate: updates.billDate } : {}),
//       ...(updates.totalAmount !== undefined
//         ? { totalAmount: updates.totalAmount }
//         : {}),
//     });
//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//   });
// }

// export async function getSupplierPayments(
//   supplierId?: string,
//   startDate?: string,
//   endDate?: string,
// ): Promise<SupplierPaymentWithSupplier[]> {
//   const snapshot = await getDocs(supplierPaymentsCollection);
//   let payments = snapshot.docs.map(mapDoc<SupplierPayment>);

//   if (supplierId) {
//     payments = payments.filter((payment) => payment.supplierId === supplierId);
//   }
//   if (startDate) {
//     payments = payments.filter((payment) => payment.paymentDate >= startDate);
//   }
//   if (endDate) {
//     payments = payments.filter((payment) => payment.paymentDate <= endDate);
//   }

//   const sorted = payments.sort((a, b) =>
//     b.paymentDate.localeCompare(a.paymentDate),
//   );
//   return Promise.all(
//     sorted.map(async (payment) => ({
//       ...payment,
//       supplierName:
//         (await getSupplierById(payment.supplierId))?.supplierName ??
//         "Unknown Supplier",
//     })),
//   );
// }

// export async function createSupplierPayment(
//   supplierId: string,
//   supplierName: string,
//   amount: number,
//   paymentMethod: PaymentMethod,
//   notes: string,
//   paymentDate: string,
// ): Promise<SupplierPaymentWithSupplier> {
//   const id = generateId();
//   const receiptNumber = generateReceiptNumber();
//   const createdAt = toISOString();

//   await runTransaction(db, async (transaction) => {
//     const supplierRef = doc(suppliersCollection, supplierId);
//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const currentBalance = supplierData.outstandingBalance ?? 0;
//     const newBalance = Math.max(0, currentBalance - amount);

//     transaction.set(doc(supplierPaymentsCollection, id), {
//       id,
//       supplierId,
//       amount,
//       paymentMethod,
//       notes,
//       paymentDate,
//       createdAt,
//       receiptNumber,
//     });
//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//   });

//   return {
//     id,
//     supplierId,
//     supplierName,
//     amount,
//     paymentMethod,
//     notes,
//     paymentDate,
//     createdAt,
//     receiptNumber,
//   };
// }

// export async function updateSupplierPaymentData(
//   paymentId: string,
//   updates: {
//     amount: number;
//     paymentMethod: PaymentMethod;
//     paymentDate: string;
//     notes?: string;
//   },
// ): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const paymentRef = doc(supplierPaymentsCollection, paymentId);
//     const paymentSnap = await transaction.get(paymentRef);
//     if (!paymentSnap.exists()) throw new Error("Payment not found");

//     const paymentData = paymentSnap.data() as SupplierPayment;
//     const amountDiff = updates.amount - paymentData.amount;

//     const supplierRef = doc(suppliersCollection, paymentData.supplierId);
//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const newBalance = Math.max(
//       0,
//       (supplierData.outstandingBalance ?? 0) - amountDiff,
//     );

//     transaction.update(paymentRef, updates);
//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//   });
// }

// export async function deleteSupplierPayment(paymentId: string): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const paymentRef = doc(supplierPaymentsCollection, paymentId);
//     const paymentSnap = await transaction.get(paymentRef);
//     if (!paymentSnap.exists()) throw new Error("Payment not found");

//     const paymentData = paymentSnap.data() as SupplierPayment;
//     const supplierRef = doc(suppliersCollection, paymentData.supplierId);
//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const newBalance =
//       (supplierData.outstandingBalance ?? 0) + paymentData.amount;

//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//     transaction.delete(paymentRef);
//   });
// }

// export async function deleteSupplierBill(billId: string): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const billRef = doc(supplierBillsCollection, billId);
//     const billSnap = await transaction.get(billRef);
//     if (!billSnap.exists()) throw new Error("Bill not found");

//     const billData = billSnap.data() as SupplierPurchaseBill;
//     const supplierRef = doc(suppliersCollection, billData.supplierId);
//     const supplierSnap = await transaction.get(supplierRef);
//     if (!supplierSnap.exists()) throw new Error("Supplier not found");

//     const supplierData = supplierSnap.data() as Supplier;
//     const newBalance = Math.max(
//       0,
//       (supplierData.outstandingBalance ?? 0) - billData.totalAmount,
//     );

//     transaction.update(supplierRef, { outstandingBalance: newBalance });
//     transaction.delete(billRef);
//   });
// }

// // Sales
// export async function createSale(
//   shopId: string,
//   items: {
//     productId: string;
//     quantity: number;
//     rate: number;
//     purchasePrice: number;
//   }[],
//   discount: number,
// ): Promise<SaleWithDetails> {
//   const saleId = generateId();
//   const invoiceNumber = generateInvoiceNumber();
//   const createdAt = toISOString();
//   const saleItems: SaleItem[] = [];
//   const productSnapshotMap: Record<string, Product> = {};

//   const { ref: shopRef, shop: resolvedShop } =
//     await resolveShopDocument(shopId);
//   if (!resolvedShop) throw new Error("Shop not found");

//   const resolvedShopId = resolvedShop.id;

//   await runTransaction(db, async (transaction) => {
//     const shopSnap = await transaction.get(shopRef);
//     if (!shopSnap.exists()) throw new Error("Shop not found");
//     const shopData = shopSnap.data() as Shop;

//     const productSnapshots = await Promise.all(
//       items.map((item) =>
//         transaction.get(doc(productsCollection, item.productId)),
//       ),
//     );

//     for (let i = 0; i < items.length; i += 1) {
//       const item = items[i];
//       const productSnap = productSnapshots[i];
//       if (!productSnap.exists()) {
//         throw new Error(`Product not found: ${item.productId}`);
//       }
//       const product = productSnap.data() as Product;
//       const normalizedQuantity = Number(item.quantity) || 0;
//       const availableStock = Number(product.stockQuantity) || 0;
//       const normalizedRate = Number(item.rate) || 0;
//       const normalizedPurchasePrice = Number(item.purchasePrice) || 0;

//       if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
//         throw new Error("Each item must have a valid quantity");
//       }

//       productSnapshotMap[item.productId] = {
//         ...product,
//         stockQuantity: availableStock,
//         purchasePrice: normalizedPurchasePrice,
//         sellingPrice: normalizedRate,
//       };

//       if (normalizedQuantity > availableStock) {
//         throw new Error(
//           `Insufficient stock for ${product.productName}. Available: ${availableStock}`,
//         );
//       }
//     }

//     const normalizedDiscount = Number(discount) || 0;
//     const subtotal = items.reduce(
//       (sum, item) => sum + Number(item.quantity) * Number(item.rate),
//       0,
//     );
//     const grandTotal = Math.max(0, subtotal - normalizedDiscount);
//     const itemProfit = items.reduce(
//       (sum, item) =>
//         sum +
//         (Number(item.rate) - Number(item.purchasePrice)) *
//           Number(item.quantity),
//       0,
//     );
//     const profit =
//       subtotal > 0 ? itemProfit * (grandTotal / subtotal) : itemProfit;
//     const currentOutstandingBalance = Number(shopData.outstandingBalance) || 0;
//     const newBalance = currentOutstandingBalance + grandTotal;

//     transaction.set(doc(salesCollection, saleId), {
//       id: saleId,
//       invoiceNumber,
//       shopId: resolvedShopId,
//       subtotal,
//       discount,
//       grandTotal,
//       profit,
//       createdAt,
//     });

//     for (let i = 0; i < items.length; i += 1) {
//       const item = items[i];
//       const productSnap = productSnapshots[i];
//       if (!productSnap.exists()) {
//         continue;
//       }
//       const product = productSnap.data() as Product;
//       const normalizedQuantity = Number(item.quantity) || 0;
//       const normalizedRate = Number(item.rate) || 0;
//       const itemId = generateId();
//       const total = normalizedQuantity * normalizedRate;
//       transaction.set(doc(saleItemsCollection, itemId), {
//         id: itemId,
//         saleId,
//         productId: item.productId,
//         quantity: normalizedQuantity,
//         rate: normalizedRate,
//         total,
//       });
//       const currentStock = Number(product.stockQuantity) || 0;
//       transaction.update(doc(productsCollection, item.productId), {
//         stockQuantity: Math.max(0, currentStock - normalizedQuantity),
//       });
//       saleItems.push({
//         id: itemId,
//         saleId,
//         productId: item.productId,
//         quantity: normalizedQuantity,
//         rate: normalizedRate,
//         total,
//       });
//     }

//     transaction.update(shopRef, { outstandingBalance: newBalance });
//     transaction.set(doc(ledgersCollection, generateId()), {
//       id: generateId(),
//       shopId: resolvedShopId,
//       transactionType: "sale",
//       referenceNumber: invoiceNumber,
//       debit: grandTotal,
//       credit: 0,
//       balance: newBalance,
//       createdAt,
//     });
//   });

//   const persistedShop = await getShopById(shopId);
//   const shopName = persistedShop?.shopName ?? "";
//   const saleItemsWithName = await Promise.all(
//     saleItems.map(async (item) => {
//       const product = await getProductById(item.productId);
//       return {
//         ...item,
//         productName: product?.productName ?? "",
//       };
//     }),
//   );

//   return {
//     id: saleId,
//     invoiceNumber,
//     shopId: resolvedShopId,
//     subtotal: saleItems.reduce((sum, item) => sum + item.total, 0),
//     discount,
//     grandTotal: saleItems.reduce((sum, item) => sum + item.total, 0) - discount,
//     profit: saleItemsWithName.reduce(
//       (sum, item) =>
//         sum +
//         (item.rate - (productSnapshotMap[item.productId]?.purchasePrice ?? 0)) *
//           item.quantity,
//       0,
//     ),
//     createdAt,
//     shopName,
//     items: saleItemsWithName,
//   };
// }

// export async function getMonthlyChartData(): Promise<
//   { month: string; sales: number; profit: number }[]
// > {
//   const startDate = new Date();
//   startDate.setMonth(startDate.getMonth() - 11); // Last 12 months

//   const q = query(
//     salesCollection,
//     where("createdAt", ">=", startDate.toISOString()),
//     orderBy("createdAt", "asc"),
//     limit(1000),
//   );

//   const snapshot = await getDocs(q);
//   const salesDocs = snapshot.docs.map(mapDoc<Sale>);

//   const monthMap = new Map<string, { sales: number; profit: number }>();

//   for (const sale of salesDocs) {
//     if (!sale.createdAt) continue;

//     const month = sale.createdAt.slice(0, 7); // YYYY-MM

//     const existing = monthMap.get(month) ?? {
//       sales: 0,
//       profit: 0,
//     };

//     monthMap.set(month, {
//       sales: existing.sales + Number(sale.grandTotal || 0),
//       profit: existing.profit + Number(sale.profit || 0),
//     });
//   }

//   return Array.from(monthMap.entries()).map(([month, { sales, profit }]) => ({
//     month,
//     sales,
//     profit,
//   }));
// }

// // Recent Sales
// export async function getRecentSales(
//   limitNum: number,
// ): Promise<SaleWithDetails[]> {
//   // Query the most recent sales ordered by creation timestamp
//   const recentSalesQuery = query(
//     salesCollection,
//     orderBy("createdAt", "desc"),
//     limit(limitNum),
//   );
//   const salesSnap = await getDocs(recentSalesQuery);

//   const results: SaleWithDetails[] = [];
//   for (const saleDoc of salesSnap.docs) {
//     const sale = mapDoc<Sale>(saleDoc);
//     // Fetch associated sale items
//     const itemsSnap = await getDocs(
//       query(saleItemsCollection, where("saleId", "==", sale.id)),
//     );
//     const rawItems = itemsSnap.docs.map(mapDoc<SaleItem>);

//     // Enrich items with product name
//     const enrichedItems = await Promise.all(
//       rawItems.map(async (item) => {
//         const product = await getProductById(item.productId);
//         return {
//           ...item,
//           productName: product?.productName ?? "",
//         } as SaleItem & { productName: string };
//       }),
//     );

//     // Compute totals and profit
//     const subtotal = enrichedItems.reduce(
//       (sum, it) => sum + (it.total ?? 0),
//       0,
//     );
//     const discount = (sale as any).discount ?? 0;
//     const grandTotal = subtotal - discount;
//     // Compute profit using purchase price from each product
//     const profit = await Promise.all(
//       enrichedItems.map(async (it) => {
//         const prod = await getProductById(it.productId);
//         const purchasePrice = prod?.purchasePrice ?? 0;
//         return (it.rate - purchasePrice) * it.quantity;
//       }),
//     ).then((vals) => vals.reduce((sum, v) => sum + v, 0));

//     // Resolve shop name
//     const shop = await getShopById(sale.shopId);
//     const shopName = shop?.shopName ?? "";

//     results.push({
//       id: sale.id,
//       invoiceNumber: (sale as any).invoiceNumber ?? "",
//       shopId: sale.shopId,
//       subtotal,
//       discount,
//       grandTotal,
//       profit,
//       createdAt: sale.createdAt,
//       shopName,
//       items: enrichedItems,
//     });
//   }
//   return results;
// }

// // Get Sales
// export async function getSales(
//   startDate?: string,
//   endDate?: string,
//   shopId?: string,
// ): Promise<SaleWithDetails[]> {
//   const sales = await getRecentSales(100);

//   return sales.filter((sale) => {
//     let ok = true;

//     if (shopId) {
//       ok = ok && sale.shopId === shopId;
//     }

//     if (startDate) {
//       ok = ok && sale.createdAt >= startDate;
//     }

//     if (endDate) {
//       ok = ok && sale.createdAt <= endDate;
//     }

//     return ok;
//   });
// }

// export async function getPayments(
//   startDate?: string,
//   endDate?: string,
//   shopId?: string,
// ): Promise<PaymentWithShop[]> {
//   const snapshot = await getDocs(paymentsCollection);

//   let payments = snapshot.docs.map(mapDoc<Payment>);

//   if (shopId) {
//     payments = payments.filter((p) => p.shopId === shopId);
//   }

//   if (startDate) {
//     payments = payments.filter((p) => p.createdAt >= startDate);
//   }

//   if (endDate) {
//     payments = payments.filter((p) => p.createdAt <= endDate);
//   }

//   const sortedPayments = payments.sort((a, b) =>
//     b.createdAt.localeCompare(a.createdAt),
//   );

//   return Promise.all(
//     sortedPayments.map(async (payment) => {
//       const shop = await getShopById(payment.shopId);
//       return {
//         ...payment,
//         shopName: shop?.shopName ?? "Unknown Shop",
//       };
//     }),
//   );
// }

// export async function createPayment(
//   shopId: string,
//   amount: number,
//   paymentMethod: PaymentMethod,
//   notes: string,
//   paymentDate: string,
// ): Promise<PaymentWithShop> {
//   const paymentId = generateId();
//   const receiptNumber = generateReceiptNumber();
//   const createdAt = toISOString();

//   await runTransaction(db, async (transaction) => {
//     const shopRef = doc(shopsCollection, shopId);
//     const shopSnap = await transaction.get(shopRef);
//     if (!shopSnap.exists()) {
//       throw new Error("Shop not found");
//     }

//     const shopData = shopSnap.data() as Shop;
//     const currentBalance = Number(shopData.outstandingBalance) || 0;
//     const newBalance = currentBalance - amount;

//     transaction.set(doc(paymentsCollection, paymentId), {
//       id: paymentId,
//       shopId,
//       amount,
//       paymentMethod,
//       notes,
//       paymentDate,
//       createdAt,
//       receiptNumber,
//     });

//     transaction.update(shopRef, { outstandingBalance: newBalance });

//     transaction.set(doc(ledgersCollection, generateId()), {
//       id: generateId(),
//       shopId,
//       transactionType: "payment",
//       referenceNumber: receiptNumber,
//       debit: 0,
//       credit: amount,
//       balance: newBalance,
//       createdAt,
//     });
//   });

//   const shop = await getShopById(shopId);
//   return {
//     id: paymentId,
//     shopId,
//     amount,
//     paymentMethod,
//     notes,
//     paymentDate,
//     createdAt,
//     receiptNumber,
//     shopName: shop?.shopName ?? "Unknown Shop",
//   };
// }

// export async function getDashboardStats(): Promise<DashboardStats> {
//   const [shops, products, sales, payments] = await Promise.all([
//     getShops(),
//     getProducts(),
//     getRecentSales(100),
//     getPayments(),
//   ]);

//   const now = new Date();

//   const today = now.toISOString().slice(0, 10);
//   const month = now.toISOString().slice(0, 7);
//   const year = now.getFullYear().toString();

//   let salesToday = 0;
//   let salesMonth = 0;
//   let salesYear = 0;

//   let profitToday = 0;
//   let profitMonth = 0;
//   let profitYear = 0;

//   for (const sale of sales) {
//     const createdAt = sale.createdAt;

//     if (createdAt.startsWith(year)) {
//       salesYear += sale.grandTotal;
//       profitYear += sale.profit;
//     }

//     if (createdAt.startsWith(month)) {
//       salesMonth += sale.grandTotal;
//       profitMonth += sale.profit;
//     }

//     if (createdAt.startsWith(today)) {
//       salesToday += sale.grandTotal;
//       profitToday += sale.profit;
//     }
//   }

//   const outstandingBalance = shops.reduce(
//     (sum, shop) => sum + (shop.outstandingBalance ?? 0),
//     0,
//   );

//   const paymentsCollected = payments.reduce(
//     (sum, payment) => sum + payment.amount,
//     0,
//   );

//   return {
//     totalShops: shops.length,
//     totalProducts: products.length,
//     salesToday,
//     salesMonth,
//     salesYear,
//     profitToday,
//     profitMonth,
//     profitYear,
//     outstandingBalance,
//     paymentsCollected,
//   };
// }

// export async function getTopSellingProducts() {
//   const snapshot = await getDocs(saleItemsCollection);

//   const saleItems = snapshot.docs.map(mapDoc<SaleItem>);

//   const map = new Map<
//     string,
//     {
//       productName: string;
//       totalQuantity: number;
//       totalRevenue: number;
//     }
//   >();

//   for (const item of saleItems) {
//     const product = await getProductById(item.productId);

//     const existing = map.get(item.productId) ?? {
//       productName: product?.productName ?? "Unknown Product",
//       totalQuantity: 0,
//       totalRevenue: 0,
//     };

//     existing.totalQuantity += item.quantity;
//     existing.totalRevenue += item.total;

//     map.set(item.productId, existing);
//   }

//   return Array.from(map.values())
//     .sort((a, b) => b.totalQuantity - a.totalQuantity)
//     .slice(0, 10);
// }

// export async function getRecentPayments(
//   limitNum: number,
// ): Promise<PaymentWithShop[]> {
//   const q = query(
//     paymentsCollection,
//     orderBy("createdAt", "desc"),
//     limit(limitNum),
//   );

//   const snapshot = await getDocs(q);

//   const payments = snapshot.docs.map(mapDoc<Payment>);

//   return Promise.all(
//     payments.map(async (payment) => {
//       const shop = await getShopById(payment.shopId);
//       return {
//         ...payment,
//         shopName: shop?.shopName ?? "Unknown Shop",
//       };
//     }),
//   );
// }

// export async function getSaleByInvoiceNumber(
//   invoiceNumber: string,
// ): Promise<SaleWithDetails | null> {
//   const q = query(
//     salesCollection,
//     where("invoiceNumber", "==", invoiceNumber),
//     limit(1),
//   );
//   const snap = await getDocs(q);
//   if (snap.empty) return null;
//   const sale = mapDoc<Sale>(snap.docs[0]);

//   const itemsSnap = await getDocs(
//     query(saleItemsCollection, where("saleId", "==", sale.id)),
//   );
//   const rawItems = itemsSnap.docs.map(mapDoc<SaleItem>);

//   const enrichedItems = await Promise.all(
//     rawItems.map(async (item) => {
//       const product = await getProductById(item.productId);
//       return {
//         ...item,
//         productName: product?.productName ?? "",
//       } as SaleItem & { productName: string };
//     }),
//   );

//   const shop = await getShopById(sale.shopId);
//   return {
//     ...sale,
//     shopName: shop?.shopName ?? "",
//     items: enrichedItems,
//   };
// }

// export async function deleteSale(saleId: string): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const saleRef = doc(salesCollection, saleId);
//     const saleSnap = await transaction.get(saleRef);
//     if (!saleSnap.exists()) throw new Error("Sale not found");
//     const saleData = saleSnap.data() as Sale;

//     const shopRef = doc(shopsCollection, saleData.shopId);
//     const shopSnap = await transaction.get(shopRef);
//     if (shopSnap.exists()) {
//       const shopData = shopSnap.data() as Shop;
//       const newBalance = Math.max(
//         0,
//         (shopData.outstandingBalance ?? 0) - saleData.grandTotal,
//       );
//       transaction.update(shopRef, { outstandingBalance: newBalance });
//     }

//     const itemsSnap = await getDocs(
//       query(saleItemsCollection, where("saleId", "==", saleId)),
//     );
//     for (const itemDoc of itemsSnap.docs) {
//       const itemData = itemDoc.data() as SaleItem;
//       const productRef = doc(productsCollection, itemData.productId);
//       const productSnap = await transaction.get(productRef);
//       if (productSnap.exists()) {
//         const currentStock = Number(productSnap.data().stockQuantity) || 0;
//         transaction.update(productRef, {
//           stockQuantity: currentStock + itemData.quantity,
//         });
//       }
//       transaction.delete(itemDoc.ref);
//     }

//     const ledgerSnap = await getDocs(
//       query(
//         ledgersCollection,
//         where("referenceNumber", "==", saleData.invoiceNumber),
//       ),
//     );
//     for (const lDoc of ledgerSnap.docs) {
//       transaction.delete(lDoc.ref);
//     }

//     transaction.delete(saleRef);
//   });
// }

// export async function getPaymentByReceiptNumber(
//   receiptNumber: string,
// ): Promise<(Payment & { shopName: string }) | null> {
//   const q = query(
//     paymentsCollection,
//     where("receiptNumber", "==", receiptNumber),
//     limit(1),
//   );
//   const snap = await getDocs(q);
//   if (snap.empty) return null;
//   const payment = mapDoc<Payment>(snap.docs[0]);
//   const shop = await getShopById(payment.shopId);
//   return { ...payment, shopName: shop?.shopName ?? "" } as Payment & {
//     shopName: string;
//   };
// }

// export async function deletePayment(paymentId: string): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const paymentRef = doc(paymentsCollection, paymentId);
//     const paymentSnap = await transaction.get(paymentRef);
//     if (!paymentSnap.exists()) throw new Error("Payment not found");
//     const paymentData = paymentSnap.data() as Payment & {
//       receiptNumber: string;
//     };

//     const shopRef = doc(shopsCollection, paymentData.shopId);
//     const shopSnap = await transaction.get(shopRef);
//     if (shopSnap.exists()) {
//       const shopData = shopSnap.data() as Shop;
//       const newBalance =
//         (shopData.outstandingBalance ?? 0) + paymentData.amount;
//       transaction.update(shopRef, { outstandingBalance: newBalance });
//     }

//     const ledgerSnap = await getDocs(
//       query(
//         ledgersCollection,
//         where("referenceNumber", "==", paymentData.receiptNumber || ""),
//       ),
//     );
//     for (const lDoc of ledgerSnap.docs) {
//       transaction.delete(lDoc.ref);
//     }

//     transaction.delete(paymentRef);
//   });
// }

// export async function updatePaymentData(
//   paymentId: string,
//   updates: {
//     amount: number;
//     paymentMethod: PaymentMethod;
//     paymentDate: string;
//     notes?: string;
//   },
// ): Promise<void> {
//   await runTransaction(db, async (transaction) => {
//     const paymentRef = doc(paymentsCollection, paymentId);
//     const paymentSnap = await transaction.get(paymentRef);
//     if (!paymentSnap.exists()) throw new Error("Payment not found");
//     const paymentData = paymentSnap.data() as Payment & {
//       receiptNumber: string;
//     };

//     const amountDiff = updates.amount - paymentData.amount;

//     const shopRef = doc(shopsCollection, paymentData.shopId);
//     const shopSnap = await transaction.get(shopRef);
//     if (shopSnap.exists()) {
//       const shopData = shopSnap.data() as Shop;
//       const newBalance = Math.max(
//         0,
//         (shopData.outstandingBalance ?? 0) - amountDiff,
//       );
//       transaction.update(shopRef, { outstandingBalance: newBalance });
//     }

//     transaction.update(paymentRef, updates);

//     const ledgerSnap = await getDocs(
//       query(
//         ledgersCollection,
//         where("referenceNumber", "==", paymentData.receiptNumber || ""),
//       ),
//     );
//     for (const lDoc of ledgerSnap.docs) {
//       transaction.update(lDoc.ref, { credit: updates.amount });
//     }
//   });
// }

// export async function updateSaleData(
//   saleId: string,
//   updates: {
//     items: {
//       productId: string;
//       quantity: number;
//       rate: number;
//       total: number;
//     }[];
//     subtotal: number;
//     discount: number;
//     grandTotal: number;
//     profit: number;
//   },
// ): Promise<void> {
//   // ---------- ALL READS ----------
//   const saleRef = doc(salesCollection, saleId);
//   const saleSnap = await getDoc(saleRef);

//   if (!saleSnap.exists()) {
//     throw new Error("Sale not found");
//   }

//   const oldSale = saleSnap.data() as Sale;

//   const shopRef = doc(shopsCollection, oldSale.shopId);
//   const shopSnap = await getDoc(shopRef);

//   const oldItemsSnap = await getDocs(
//     query(saleItemsCollection, where("saleId", "==", saleId)),
//   );

//   const ledgerSnap = await getDocs(
//     query(
//       ledgersCollection,
//       where("referenceNumber", "==", oldSale.invoiceNumber),
//     ),
//   );

//   // Read ALL old products

//   const oldProducts = await Promise.all(
//     oldItemsSnap.docs.map(async (d) => {
//       const item = d.data() as SaleItem;
//       const ref = doc(productsCollection, item.productId);
//       const snap = await getDoc(ref);

//       return {
//         ref,
//         snap,
//         item,
//       };
//     }),
//   );

//   // Read ALL new products

//   const newProducts = await Promise.all(
//     updates.items.map(async (item) => {
//       const ref = doc(productsCollection, item.productId);
//       const snap = await getDoc(ref);

//       return {
//         ref,
//         snap,
//         item,
//       };
//     }),
//   );

//   // ---------- TRANSACTION ----------

//   await runTransaction(db, async (transaction) => {
//     // Restore old stock

//     for (const old of oldProducts) {
//       if (!old.snap.exists()) continue;

//       const stock = Number(old.snap.data().stockQuantity) || 0;

//       transaction.update(old.ref, {
//         stockQuantity: stock + old.item.quantity,
//       });

//       transaction.delete(doc(saleItemsCollection, old.item.id));
//     }

//     // Deduct new stock

//     for (const p of newProducts) {
//       if (!p.snap.exists()) {
//         throw new Error("Product not found");
//       }

//       const stock = Number(p.snap.data().stockQuantity) || 0;

//       if (stock < p.item.quantity) {
//         throw new Error("Insufficient stock");
//       }

//       transaction.update(p.ref, {
//         stockQuantity: stock - p.item.quantity,
//       });

//       const newSaleItemRef = doc(saleItemsCollection);

//       transaction.set(newSaleItemRef, {
//         id: newSaleItemRef.id,
//         saleId,
//         productId: p.item.productId,
//         quantity: p.item.quantity,
//         rate: p.item.rate,
//         total: p.item.total,
//       });
//     }

//     // Update Sale

//     transaction.update(saleRef, {
//       subtotal: updates.subtotal,
//       discount: updates.discount,
//       grandTotal: updates.grandTotal,
//       profit: updates.profit,
//     });

//     // Update Shop Balance

//     if (shopSnap.exists()) {
//       const shop = shopSnap.data() as Shop;

//       // const newBalance =
//       //   (shop.outstandingBalance || 0) -
//       //   oldSale.grandTotal +
//       //   updates.grandTotal;

//       // transaction.update(shopRef, {
//       //   outstandingBalance: newBalance,
//       // });
//       const difference = updates.grandTotal - oldSale.grandTotal;

//       transaction.update(shopRef, {
//         outstandingBalance: (shop.outstandingBalance || 0) + difference,
//       });
//     }

//     // Update Ledger

//     ledgerSnap.docs.forEach((docSnap) => {
//       transaction.update(docSnap.ref, {
//         debit: updates.grandTotal,
//       });
//     });
//   });
// }

// export async function getLedgerEntries(
//   shopId?: string,
//   startDate?: string,
//   endDate?: string,
// ): Promise<LedgerEntry[]> {
//   const snapshot = await getDocs(ledgersCollection);
//   let entries = snapshot.docs.map(mapDoc<LedgerEntry>);

//   if (shopId) {
//     entries = entries.filter((entry) => entry.shopId === shopId);
//   }

//   if (startDate) {
//     entries = entries.filter((entry) => entry.createdAt >= startDate);
//   }

//   if (endDate) {
//     entries = entries.filter((entry) => entry.createdAt <= endDate);
//   }

//   return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
// }

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

import { auth, db } from "../config/firebase";

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
  Supplier,
  SupplierPayment,
  SupplierPaymentWithSupplier,
  SupplierPurchaseBill,
  SupplierBillItem,
  User,
} from "../types";

import {
  generateId,
  generateInvoiceNumber,
  generateReceiptNumber,
  toISOString,
} from "../utils/formatters";
const usersCollection = collection(db, "users");
const productsCollection = collection(db, "products");
const shopsCollection = collection(db, "shops");
const suppliersCollection = collection(db, "suppliers");
const salesCollection = collection(db, "sales");
const saleItemsCollection = collection(db, "sale_items");
const paymentsCollection = collection(db, "payments");
const supplierPaymentsCollection = collection(db, "supplier_payments");
const supplierBillsCollection = collection(db, "supplier_bills");
const ledgersCollection = collection(db, "ledgers");
const cartsCollection = collection(db, "carts");
const expensesCollection = collection(db, "expenses");

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
  // await seedDatabase();
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

/**
 * Recomputes the running `balance` field on every ledger entry for a shop,
 * in chronological order, starting from the shop's openingBalance.
 *
 * This MUST be called after any operation that creates, edits, or deletes a
 * sale or payment for a shop, because those operations change historical
 * debit/credit amounts (or remove entries entirely) without otherwise
 * updating the stored running balance on affected ledger rows. Without this,
 * the `balance` column drifts from the shop's real outstandingBalance and
 * every entry after the edited/deleted one becomes stale.
 */
async function recalculateShopLedgerBalances(shopId: string): Promise<void> {
  const shop = await getShopById(shopId);
  const openingBalance = Number(shop?.openingBalance) || 0;

  const snapshot = await getDocs(
    query(ledgersCollection, where("shopId", "==", shopId)),
  );

  const entries = snapshot.docs
    .map((docSnap) => ({
      ref: docSnap.ref,
      data: mapDoc<LedgerEntry>(docSnap),
    }))
    .sort((a, b) => a.data.createdAt.localeCompare(b.data.createdAt));

  let runningBalance = openingBalance;
  for (const entry of entries) {
    const debit = Number(entry.data.debit) || 0;
    const credit = Number(entry.data.credit) || 0;
    runningBalance += debit - credit;

    if (runningBalance !== entry.data.balance) {
      await updateDoc(entry.ref, { balance: runningBalance });
    }
  }
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
    products = products.filter((product) => product.category === category);
  }

  return products.sort((a, b) =>
    (a.productName ?? "").localeCompare(b.productName ?? ""),
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
  if (product.minStock !== undefined) payload.minStock = product.minStock;
  if (product.unit !== undefined) payload.unit = product.unit;
  if (product.supplierId !== undefined) payload.supplierId = product.supplierId;
  if (product.supplierName !== undefined)
    payload.supplierName = product.supplierName;
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
  shop: Omit<Shop, "id" | "createdAt">,
): Promise<Shop> {
  const id = generateId();
  const createdAt = toISOString();
  const outstandingBalance = shop.outstandingBalance ?? 0;
  await setDoc(doc(shopsCollection, id), {
    id,
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    phoneNumber: shop.phoneNumber,
    address: shop.address,
    creditLimit: shop.creditLimit,
    outstandingBalance,
    openingBalance: shop.openingBalance ?? outstandingBalance,
    notes: shop.notes,
    createdAt,
  });
  return { ...shop, id, outstandingBalance, createdAt };
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
  if (shop.openingBalance !== undefined)
    payload.openingBalance = shop.openingBalance;
  if (shop.outstandingBalance !== undefined)
    payload.outstandingBalance = shop.outstandingBalance;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(shopsCollection, id), payload);

  // If the opening balance changed, every ledger entry's running balance
  // for this shop needs to shift by the same amount.
  if (shop.openingBalance !== undefined) {
    await recalculateShopLedgerBalances(id);
  }
}

export async function deleteShop(id: string): Promise<void> {
  await deleteDoc(doc(shopsCollection, id));
}

export async function getSuppliers(search?: string): Promise<Supplier[]> {
  const snapshot = await getDocs(suppliersCollection);
  let suppliers = snapshot.docs.map(mapDoc<Supplier>);

  if (search) {
    const term = search.trim().toLowerCase();
    suppliers = suppliers.filter((supplier) => {
      const supplierName = supplier.supplierName?.toLowerCase() ?? "";
      const contactName = supplier.contactName?.toLowerCase() ?? "";
      const phoneNumber = supplier.phoneNumber?.toLowerCase() ?? "";
      return (
        supplierName.includes(term) ||
        contactName.includes(term) ||
        phoneNumber.includes(term)
      );
    });
  }

  return suppliers.sort((a, b) =>
    (a.supplierName ?? "").localeCompare(b.supplierName ?? ""),
  );
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const snapshot = await getDoc(doc(suppliersCollection, id));
  return snapshot.exists() ? mapDoc<Supplier>(snapshot) : null;
}

export async function createSupplier(
  supplier: Omit<Supplier, "id" | "createdAt">,
): Promise<Supplier> {
  const id = generateId();
  const createdAt = toISOString();
  const outstandingBalance = supplier.outstandingBalance ?? 0;
  await setDoc(doc(suppliersCollection, id), {
    id,
    ...supplier,
    createdAt,
    outstandingBalance,
    openingBalance: supplier.openingBalance ?? outstandingBalance,
  });
  return { ...supplier, id, createdAt, outstandingBalance };
}

export async function updateSupplier(
  id: string,
  supplier: Partial<Supplier>,
): Promise<void> {
  const payload: Partial<Supplier> = {};
  if (supplier.supplierName !== undefined)
    payload.supplierName = supplier.supplierName;
  if (supplier.contactName !== undefined)
    payload.contactName = supplier.contactName;
  if (supplier.phoneNumber !== undefined)
    payload.phoneNumber = supplier.phoneNumber;
  if (supplier.address !== undefined) payload.address = supplier.address;
  if (supplier.notes !== undefined) payload.notes = supplier.notes;
  if (supplier.openingBalance !== undefined)
    payload.openingBalance = supplier.openingBalance;
  if (supplier.outstandingBalance !== undefined)
    payload.outstandingBalance = supplier.outstandingBalance;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(suppliersCollection, id), payload);
}

export async function deleteSupplier(id: string): Promise<void> {
  await deleteDoc(doc(suppliersCollection, id));
}

export async function createSupplierBill(
  supplierId: string,
  supplierName: string,
  items: SupplierBillItem[],
  billDate: string,
  notes: string,
): Promise<SupplierPurchaseBill> {
  const id = generateId();
  const billNumber = `BILL-${Date.now()}`;
  const createdAt = toISOString();
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  await runTransaction(db, async (transaction) => {
    const supplierRef = doc(suppliersCollection, supplierId);
    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const currentBalance = supplierData.outstandingBalance ?? 0;
    const newBalance = currentBalance + totalAmount;

    transaction.set(doc(supplierBillsCollection, id), {
      id,
      supplierId,
      supplierName,
      billNumber,
      billDate,
      notes,
      totalAmount,
      items,
      createdAt,
    });
    transaction.update(supplierRef, { outstandingBalance: newBalance });
  });

  return {
    id,
    supplierId,
    supplierName,
    billNumber,
    billDate,
    notes,
    totalAmount,
    items,
    createdAt,
  };
}

export async function createOrUpdateSupplierBill(
  supplierId: string,
  supplierName: string,
  items: SupplierBillItem[],
  billDate: string,
  notes: string,
): Promise<SupplierPurchaseBill> {
  const normalizedDay = billDate.split("T")[0];
  const existingBills = await getSupplierBills(supplierId);
  const existingBill = existingBills.find(
    (bill) => bill.billDate.split("T")[0] === normalizedDay,
  );

  if (!existingBill) {
    return createSupplierBill(supplierId, supplierName, items, billDate, notes);
  }

  const updatedItemsMap = new Map(
    existingBill.items.map((item) => [item.productId, { ...item }]),
  );
  items.forEach((item) => {
    const existingItem = updatedItemsMap.get(item.productId);
    if (existingItem) {
      const combinedQuantity = existingItem.quantity + item.quantity;
      const combinedTotal = existingItem.total + item.total;
      existingItem.quantity = combinedQuantity;
      existingItem.total = combinedTotal;
      existingItem.purchasePrice =
        combinedQuantity > 0
          ? combinedTotal / combinedQuantity
          : item.purchasePrice;
      updatedItemsMap.set(item.productId, existingItem);
    } else {
      updatedItemsMap.set(item.productId, { ...item });
    }
  });

  const updatedItems = Array.from(updatedItemsMap.values());
  const updatedTotalAmount = updatedItems.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const noteText = [existingBill.notes, notes].filter(Boolean).join(" | ");

  await runTransaction(db, async (transaction) => {
    const billRef = doc(supplierBillsCollection, existingBill.id);
    const supplierRef = doc(suppliersCollection, supplierId);

    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const currentBalance = supplierData.outstandingBalance ?? 0;
    const newBalance =
      currentBalance + (updatedTotalAmount - existingBill.totalAmount);

    transaction.update(billRef, {
      items: updatedItems,
      totalAmount: updatedTotalAmount,
      notes: noteText,
    });
    transaction.update(supplierRef, { outstandingBalance: newBalance });
  });

  return {
    ...existingBill,
    items: updatedItems,
    totalAmount: updatedTotalAmount,
    notes: noteText,
  };
}

export async function getSupplierBills(
  supplierId?: string,
  startDate?: string,
  endDate?: string,
): Promise<SupplierPurchaseBill[]> {
  const snapshot = await getDocs(supplierBillsCollection);
  let bills = snapshot.docs.map(mapDoc<SupplierPurchaseBill>);

  if (supplierId) {
    bills = bills.filter((bill) => bill.supplierId === supplierId);
  }
  if (startDate) {
    bills = bills.filter((bill) => bill.billDate >= startDate);
  }
  if (endDate) {
    bills = bills.filter((bill) => bill.billDate <= endDate);
  }

  return bills.sort((a, b) => b.billDate.localeCompare(a.billDate));
}

export async function getSupplierBill(
  billId: string,
): Promise<SupplierPurchaseBill | null> {
  const billSnap = await getDoc(doc(supplierBillsCollection, billId));
  return billSnap.exists() ? mapDoc<SupplierPurchaseBill>(billSnap) : null;
}

export async function updateSupplierBillData(
  billId: string,
  updates: {
    items?: SupplierBillItem[];
    notes?: string;
    billDate?: string;
    totalAmount?: number;
  },
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const billRef = doc(supplierBillsCollection, billId);
    const billSnap = await transaction.get(billRef);
    if (!billSnap.exists()) throw new Error("Bill not found");

    const billData = billSnap.data() as SupplierPurchaseBill;
    const oldTotal = billData.totalAmount;
    const newTotal = updates.totalAmount ?? oldTotal;
    const delta = newTotal - oldTotal;

    const supplierRef = doc(suppliersCollection, billData.supplierId);
    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const currentBalance = supplierData.outstandingBalance ?? 0;
    const newBalance = Math.max(0, currentBalance + delta);

    transaction.update(billRef, {
      ...(updates.items !== undefined ? { items: updates.items } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.billDate !== undefined ? { billDate: updates.billDate } : {}),
      ...(updates.totalAmount !== undefined
        ? { totalAmount: updates.totalAmount }
        : {}),
    });
    transaction.update(supplierRef, { outstandingBalance: newBalance });
  });
}

export async function getSupplierPayments(
  supplierId?: string,
  startDate?: string,
  endDate?: string,
): Promise<SupplierPaymentWithSupplier[]> {
  const snapshot = await getDocs(supplierPaymentsCollection);
  let payments = snapshot.docs.map(mapDoc<SupplierPayment>);

  if (supplierId) {
    payments = payments.filter((payment) => payment.supplierId === supplierId);
  }
  if (startDate) {
    payments = payments.filter((payment) => payment.paymentDate >= startDate);
  }
  if (endDate) {
    payments = payments.filter((payment) => payment.paymentDate <= endDate);
  }

  const sorted = payments.sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  );
  return Promise.all(
    sorted.map(async (payment) => ({
      ...payment,
      supplierName:
        (await getSupplierById(payment.supplierId))?.supplierName ??
        "Unknown Supplier",
    })),
  );
}

export async function createSupplierPayment(
  supplierId: string,
  supplierName: string,
  amount: number,
  paymentMethod: PaymentMethod,
  notes: string,
  paymentDate: string,
): Promise<SupplierPaymentWithSupplier> {
  const id = generateId();
  const receiptNumber = generateReceiptNumber();
  const createdAt = toISOString();

  await runTransaction(db, async (transaction) => {
    const supplierRef = doc(suppliersCollection, supplierId);
    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const currentBalance = supplierData.outstandingBalance ?? 0;
    const newBalance = Math.max(0, currentBalance - amount);

    transaction.set(doc(supplierPaymentsCollection, id), {
      id,
      supplierId,
      amount,
      paymentMethod,
      notes,
      paymentDate,
      createdAt,
      receiptNumber,
    });
    transaction.update(supplierRef, { outstandingBalance: newBalance });
  });

  return {
    id,
    supplierId,
    supplierName,
    amount,
    paymentMethod,
    notes,
    paymentDate,
    createdAt,
    receiptNumber,
  };
}

export async function updateSupplierPaymentData(
  paymentId: string,
  updates: {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    notes?: string;
  },
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(supplierPaymentsCollection, paymentId);
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");

    const paymentData = paymentSnap.data() as SupplierPayment;
    const amountDiff = updates.amount - paymentData.amount;

    const supplierRef = doc(suppliersCollection, paymentData.supplierId);
    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const newBalance = Math.max(
      0,
      (supplierData.outstandingBalance ?? 0) - amountDiff,
    );

    transaction.update(paymentRef, updates);
    transaction.update(supplierRef, { outstandingBalance: newBalance });
  });
}

export async function deleteSupplierPayment(paymentId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(supplierPaymentsCollection, paymentId);
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");

    const paymentData = paymentSnap.data() as SupplierPayment;
    const supplierRef = doc(suppliersCollection, paymentData.supplierId);
    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const newBalance =
      (supplierData.outstandingBalance ?? 0) + paymentData.amount;

    transaction.update(supplierRef, { outstandingBalance: newBalance });
    transaction.delete(paymentRef);
  });
}

export async function deleteSupplierBill(billId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const billRef = doc(supplierBillsCollection, billId);
    const billSnap = await transaction.get(billRef);
    if (!billSnap.exists()) throw new Error("Bill not found");

    const billData = billSnap.data() as SupplierPurchaseBill;
    const supplierRef = doc(suppliersCollection, billData.supplierId);
    const supplierSnap = await transaction.get(supplierRef);
    if (!supplierSnap.exists()) throw new Error("Supplier not found");

    const supplierData = supplierSnap.data() as Supplier;
    const newBalance = Math.max(
      0,
      (supplierData.outstandingBalance ?? 0) - billData.totalAmount,
    );

    transaction.update(supplierRef, { outstandingBalance: newBalance });
    transaction.delete(billRef);
  });
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

  // Ensure every ledger row for this shop reflects the correct running
  // balance (guards against out-of-order writes / concurrent edits).
  await recalculateShopLedgerBalances(resolvedShopId);

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

export async function getMonthlyChartData(): Promise<
  { month: string; sales: number; profit: number }[]
> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11); // Last 12 months

  const q = query(
    salesCollection,
    where("createdAt", ">=", startDate.toISOString()),
    orderBy("createdAt", "asc"),
    limit(1000),
  );

  const snapshot = await getDocs(q);
  const salesDocs = snapshot.docs.map(mapDoc<Sale>);

  const monthMap = new Map<string, { sales: number; profit: number }>();

  for (const sale of salesDocs) {
    if (!sale.createdAt) continue;

    const month = sale.createdAt.slice(0, 7); // YYYY-MM

    const existing = monthMap.get(month) ?? {
      sales: 0,
      profit: 0,
    };

    monthMap.set(month, {
      sales: existing.sales + Number(sale.grandTotal || 0),
      profit: existing.profit + Number(sale.profit || 0),
    });
  }

  return Array.from(monthMap.entries()).map(([month, { sales, profit }]) => ({
    month,
    sales,
    profit,
  }));
}

// Recent Sales
export async function getRecentSales(
  limitNum: number,
): Promise<SaleWithDetails[]> {
  // Query the most recent sales ordered by creation timestamp
  const recentSalesQuery = query(
    salesCollection,
    orderBy("createdAt", "desc"),
    limit(limitNum),
  );
  const salesSnap = await getDocs(recentSalesQuery);

  const results: SaleWithDetails[] = [];
  for (const saleDoc of salesSnap.docs) {
    const sale = mapDoc<Sale>(saleDoc);
    // Fetch associated sale items
    const itemsSnap = await getDocs(
      query(saleItemsCollection, where("saleId", "==", sale.id)),
    );
    const rawItems = itemsSnap.docs.map(mapDoc<SaleItem>);

    // Enrich items with product name
    const enrichedItems = await Promise.all(
      rawItems.map(async (item) => {
        const product = await getProductById(item.productId);
        return {
          ...item,
          productName: product?.productName ?? "",
        } as SaleItem & { productName: string };
      }),
    );

    // Compute totals and profit
    const subtotal = enrichedItems.reduce(
      (sum, it) => sum + (it.total ?? 0),
      0,
    );
    const discount = (sale as any).discount ?? 0;
    const grandTotal = subtotal - discount;
    // Compute profit using purchase price from each product
    const profit = await Promise.all(
      enrichedItems.map(async (it) => {
        const prod = await getProductById(it.productId);
        const purchasePrice = prod?.purchasePrice ?? 0;
        return (it.rate - purchasePrice) * it.quantity;
      }),
    ).then((vals) => vals.reduce((sum, v) => sum + v, 0));

    // Resolve shop name
    const shop = await getShopById(sale.shopId);
    const shopName = shop?.shopName ?? "";

    results.push({
      id: sale.id,
      invoiceNumber: (sale as any).invoiceNumber ?? "",
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
  shopId?: string,
): Promise<SaleWithDetails[]> {
  const sales = await getRecentSales(100);

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
  shopId?: string,
): Promise<PaymentWithShop[]> {
  const snapshot = await getDocs(paymentsCollection);

  let payments = snapshot.docs.map(mapDoc<Payment>);

  if (shopId) {
    payments = payments.filter((p) => p.shopId === shopId);
  }

  if (startDate) {
    payments = payments.filter((p) => p.createdAt >= startDate);
  }

  if (endDate) {
    payments = payments.filter((p) => p.createdAt <= endDate);
  }

  const sortedPayments = payments.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return Promise.all(
    sortedPayments.map(async (payment) => {
      const shop = await getShopById(payment.shopId);
      return {
        ...payment,
        shopName: shop?.shopName ?? "Unknown Shop",
      };
    }),
  );
}

export async function createPayment(
  shopId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  notes: string,
  paymentDate: string,
): Promise<PaymentWithShop> {
  const paymentId = generateId();
  const receiptNumber = generateReceiptNumber();
  const createdAt = toISOString();

  await runTransaction(db, async (transaction) => {
    const shopRef = doc(shopsCollection, shopId);
    const shopSnap = await transaction.get(shopRef);
    if (!shopSnap.exists()) {
      throw new Error("Shop not found");
    }

    const shopData = shopSnap.data() as Shop;
    const currentBalance = Number(shopData.outstandingBalance) || 0;
    const newBalance = currentBalance - amount;

    transaction.set(doc(paymentsCollection, paymentId), {
      id: paymentId,
      shopId,
      amount,
      paymentMethod,
      notes,
      paymentDate,
      createdAt,
      receiptNumber,
    });

    transaction.update(shopRef, { outstandingBalance: newBalance });

    transaction.set(doc(ledgersCollection, generateId()), {
      id: generateId(),
      shopId,
      transactionType: "payment",
      referenceNumber: receiptNumber,
      debit: 0,
      credit: amount,
      balance: newBalance,
      createdAt,
    });
  });

  // Ensure every ledger row for this shop reflects the correct running
  // balance (guards against out-of-order writes / concurrent edits).
  await recalculateShopLedgerBalances(shopId);

  const shop = await getShopById(shopId);
  return {
    id: paymentId,
    shopId,
    amount,
    paymentMethod,
    notes,
    paymentDate,
    createdAt,
    receiptNumber,
    shopName: shop?.shopName ?? "Unknown Shop",
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [shops, products, sales, payments, expenses] = await Promise.all([
    getShops(),
    getProducts(),
    getRecentSales(100),
    getPayments(),
    getExpenses(),
  ]);

  const now = new Date();

  const today = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);
  const year = now.getFullYear().toString();

  let salesToday = 0;
  let salesMonth = 0;
  let salesYear = 0;

  let profitToday = 0;
  let profitMonth = 0;
  let profitYear = 0;

  for (const sale of sales) {
    const createdAt = sale.createdAt;

    if (createdAt.startsWith(year)) {
      salesYear += sale.grandTotal;
      profitYear += sale.profit;
    }

    if (createdAt.startsWith(month)) {
      salesMonth += sale.grandTotal;
      profitMonth += sale.profit;
    }

    if (createdAt.startsWith(today)) {
      salesToday += sale.grandTotal;
      profitToday += sale.profit;
    }
  }

  let expensesToday = 0;
  let expensesMonth = 0;
  let expensesYear = 0;

  for (const exp of expenses) {
    const expDate = exp.expenseDate;
    if (expDate.startsWith(year)) {
      expensesYear += exp.amount;
    }
    if (expDate.startsWith(month)) {
      expensesMonth += exp.amount;
    }
    if (expDate.startsWith(today)) {
      expensesToday += exp.amount;
    }
  }

  const outstandingBalance = shops.reduce(
    (sum, shop) => sum + (shop.outstandingBalance ?? 0),
    0,
  );

  const paymentsCollected = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  return {
    totalShops: shops.length,
    totalProducts: products.length,
    salesToday,
    salesMonth,
    salesYear,
    profitToday: profitToday - expensesToday,
    profitMonth: profitMonth - expensesMonth,
    profitYear: profitYear - expensesYear,
    outstandingBalance,
    paymentsCollected,
    expensesToday,
    expensesMonth,
    expensesYear,
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

export async function getRecentPayments(
  limitNum: number,
): Promise<PaymentWithShop[]> {
  const q = query(
    paymentsCollection,
    orderBy("createdAt", "desc"),
    limit(limitNum),
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
    }),
  );
}

export async function getSaleByInvoiceNumber(
  invoiceNumber: string,
): Promise<SaleWithDetails | null> {
  const q = query(
    salesCollection,
    where("invoiceNumber", "==", invoiceNumber),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const sale = mapDoc<Sale>(snap.docs[0]);

  const itemsSnap = await getDocs(
    query(saleItemsCollection, where("saleId", "==", sale.id)),
  );
  const rawItems = itemsSnap.docs.map(mapDoc<SaleItem>);

  const enrichedItems = await Promise.all(
    rawItems.map(async (item) => {
      const product = await getProductById(item.productId);
      return {
        ...item,
        productName: product?.productName ?? "",
      } as SaleItem & { productName: string };
    }),
  );

  const shop = await getShopById(sale.shopId);
  return {
    ...sale,
    shopName: shop?.shopName ?? "",
    items: enrichedItems,
  };
}

export async function deleteSale(saleId: string): Promise<void> {
  let affectedShopId: string | null = null;

  await runTransaction(db, async (transaction) => {
    const saleRef = doc(salesCollection, saleId);
    const saleSnap = await transaction.get(saleRef);
    if (!saleSnap.exists()) throw new Error("Sale not found");
    const saleData = saleSnap.data() as Sale;
    affectedShopId = saleData.shopId;

    const shopRef = doc(shopsCollection, saleData.shopId);
    const shopSnap = await transaction.get(shopRef);
    if (shopSnap.exists()) {
      const shopData = shopSnap.data() as Shop;
      const newBalance = Math.max(
        0,
        (shopData.outstandingBalance ?? 0) - saleData.grandTotal,
      );
      transaction.update(shopRef, { outstandingBalance: newBalance });
    }

    const itemsSnap = await getDocs(
      query(saleItemsCollection, where("saleId", "==", saleId)),
    );
    for (const itemDoc of itemsSnap.docs) {
      const itemData = itemDoc.data() as SaleItem;
      const productRef = doc(productsCollection, itemData.productId);
      const productSnap = await transaction.get(productRef);
      if (productSnap.exists()) {
        const currentStock = Number(productSnap.data().stockQuantity) || 0;
        transaction.update(productRef, {
          stockQuantity: currentStock + itemData.quantity,
        });
      }
      transaction.delete(itemDoc.ref);
    }

    const ledgerSnap = await getDocs(
      query(
        ledgersCollection,
        where("referenceNumber", "==", saleData.invoiceNumber),
      ),
    );
    for (const lDoc of ledgerSnap.docs) {
      transaction.delete(lDoc.ref);
    }

    transaction.delete(saleRef);
  });

  // The shop's remaining ledger entries need their running balance
  // recomputed now that this sale's debit entry is gone.
  if (affectedShopId) {
    await recalculateShopLedgerBalances(affectedShopId);
  }
}

export async function getPaymentByReceiptNumber(
  receiptNumber: string,
): Promise<(Payment & { shopName: string }) | null> {
  const q = query(
    paymentsCollection,
    where("receiptNumber", "==", receiptNumber),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const payment = mapDoc<Payment>(snap.docs[0]);
  const shop = await getShopById(payment.shopId);
  return { ...payment, shopName: shop?.shopName ?? "" } as Payment & {
    shopName: string;
  };
}

export async function deletePayment(paymentId: string): Promise<void> {
  let affectedShopId: string | null = null;

  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(paymentsCollection, paymentId);
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data() as Payment & {
      receiptNumber: string;
    };
    affectedShopId = paymentData.shopId;

    const shopRef = doc(shopsCollection, paymentData.shopId);
    const shopSnap = await transaction.get(shopRef);
    if (shopSnap.exists()) {
      const shopData = shopSnap.data() as Shop;
      const newBalance =
        (shopData.outstandingBalance ?? 0) + paymentData.amount;
      transaction.update(shopRef, { outstandingBalance: newBalance });
    }

    const ledgerSnap = await getDocs(
      query(
        ledgersCollection,
        where("referenceNumber", "==", paymentData.receiptNumber || ""),
      ),
    );
    for (const lDoc of ledgerSnap.docs) {
      transaction.delete(lDoc.ref);
    }

    transaction.delete(paymentRef);
  });

  // The shop's remaining ledger entries need their running balance
  // recomputed now that this payment's credit entry is gone.
  if (affectedShopId) {
    await recalculateShopLedgerBalances(affectedShopId);
  }
}

export async function updatePaymentData(
  paymentId: string,
  updates: {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    notes?: string;
  },
): Promise<void> {
  let affectedShopId: string | null = null;

  await runTransaction(db, async (transaction) => {
    const paymentRef = doc(paymentsCollection, paymentId);
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) throw new Error("Payment not found");
    const paymentData = paymentSnap.data() as Payment & {
      receiptNumber: string;
    };
    affectedShopId = paymentData.shopId;

    const amountDiff = updates.amount - paymentData.amount;

    const shopRef = doc(shopsCollection, paymentData.shopId);
    const shopSnap = await transaction.get(shopRef);
    if (shopSnap.exists()) {
      const shopData = shopSnap.data() as Shop;
      const newBalance = Math.max(
        0,
        (shopData.outstandingBalance ?? 0) - amountDiff,
      );
      transaction.update(shopRef, { outstandingBalance: newBalance });
    }

    transaction.update(paymentRef, updates);

    const ledgerSnap = await getDocs(
      query(
        ledgersCollection,
        where("referenceNumber", "==", paymentData.receiptNumber || ""),
      ),
    );
    for (const lDoc of ledgerSnap.docs) {
      transaction.update(lDoc.ref, { credit: updates.amount });
    }
  });

  // The edited entry's credit amount changed, so every ledger row's running
  // balance for this shop (this one and everything after it) is now stale.
  if (affectedShopId) {
    await recalculateShopLedgerBalances(affectedShopId);
  }
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
  },
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
    query(saleItemsCollection, where("saleId", "==", saleId)),
  );

  const ledgerSnap = await getDocs(
    query(
      ledgersCollection,
      where("referenceNumber", "==", oldSale.invoiceNumber),
    ),
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
    }),
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
    }),
  );

  // ---------- TRANSACTION ----------

  await runTransaction(db, async (transaction) => {
    // Restore old stock

    for (const old of oldProducts) {
      if (!old.snap.exists()) continue;

      const stock = Number(old.snap.data().stockQuantity) || 0;

      transaction.update(old.ref, {
        stockQuantity: stock + old.item.quantity,
      });

      transaction.delete(doc(saleItemsCollection, old.item.id));
    }

    // Deduct new stock

    for (const p of newProducts) {
      if (!p.snap.exists()) {
        throw new Error("Product not found");
      }

      const stock = Number(p.snap.data().stockQuantity) || 0;

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

      const difference = updates.grandTotal - oldSale.grandTotal;

      transaction.update(shopRef, {
        outstandingBalance: (shop.outstandingBalance || 0) + difference,
      });
    }

    // Update Ledger (debit amount only — the running `balance` on this and
    // every later entry is fixed up afterwards by recalculateShopLedgerBalances)

    ledgerSnap.docs.forEach((docSnap) => {
      transaction.update(docSnap.ref, {
        debit: updates.grandTotal,
      });
    });
  });

  // The edited sale's debit amount changed, so every ledger row's running
  // balance for this shop (this one and everything after it) is now stale.
  await recalculateShopLedgerBalances(oldSale.shopId);
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

export async function getExpenses(
  startDate?: string,
  endDate?: string,
): Promise<Expense[]> {
  const snapshot = await getDocs(expensesCollection);
  let list = snapshot.docs.map(mapDoc<Expense>);
  if (startDate) {
    list = list.filter((e) => e.expenseDate >= startDate);
  }
  if (endDate) {
    list = list.filter((e) => e.expenseDate <= endDate);
  }
  return list.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
}

export async function createExpense(
  category: string,
  amount: number,
  notes: string,
  expenseDate: string,
): Promise<Expense> {
  const id = generateId();
  const createdAt = toISOString();
  const data = {
    id,
    category,
    amount,
    notes,
    expenseDate,
    createdAt,
  };
  await setDoc(doc(expensesCollection, id), data);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(expensesCollection, id));
}

export async function updateExpense(
  id: string,
  updates: {
    category?: string;
    amount?: number;
    notes?: string;
    expenseDate?: string;
  },
): Promise<void> {
  const payload: Record<string, any> = {};
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.expenseDate !== undefined)
    payload.expenseDate = updates.expenseDate;
  if (Object.keys(payload).length === 0) return;
  await updateDoc(doc(expensesCollection, id), payload);
}
