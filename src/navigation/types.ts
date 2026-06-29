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
  Reports: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type SalesTabParamList = {
  CreateSale: undefined;
  CollectPayment: undefined;
  ShopLedger: undefined;
};

export type RootStackParamList = AuthStackParamList;
