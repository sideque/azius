export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  RoleSelection: { role?: "admin" | "sales" } | undefined;
  AdminApp: undefined;
  SalesApp: undefined;
};

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Products: undefined;
  ProductForm: { productId?: string };
  Shops: undefined;
  ShopForm: { shopId?: string };
  Suppliers: undefined;
  SupplierForm: { supplierId?: string };
  SupplierReports: undefined;
  SupplierPayments: { paymentId?: string } | undefined;
  SupplierBilling: { billId?: string } | undefined;
  Reports: undefined;
  Notifications: undefined;
  Settings: undefined;
  EditPayment: { paymentId: string; receiptNumber: string };
  EditSale: { saleId: string; invoiceNumber: string };
};

export type SalesTabParamList = {
  CreateSale: undefined;
  CollectPayment: undefined;
  ShopLedger: undefined;
};

export type RootStackParamList = AuthStackParamList;
