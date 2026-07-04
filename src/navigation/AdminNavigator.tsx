import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { AdminDrawerParamList } from "./types";
import { DashboardScreen } from "../screens/admin/DashboardScreen";
import { ProductListScreen } from "../screens/admin/ProductListScreen";
import { ProductFormScreen } from "../screens/admin/ProductFormScreen";
import { ShopListScreen } from "../screens/admin/ShopListScreen";
import { ShopFormScreen } from "../screens/admin/ShopFormScreen";
import { SupplierListScreen } from "../screens/admin/SupplierListScreen";
import { SupplierFormScreen } from "../screens/admin/SupplierFormScreen";
import { SupplierReportsScreen } from "../screens/admin/SupplierReportsScreen";
import { SupplierPaymentsScreen } from "../screens/admin/SupplierPaymentsScreen";
import { SupplierBillingScreen } from "../screens/admin/SupplierBillingScreen";
import { NotificationsScreen } from "../screens/admin/NotificationsScreen";
import { SettingsScreen } from "../screens/admin/SettingsScreen";
import { EditPaymentScreen } from "../screens/admin/EditPaymentScreen";
import { EditSaleScreen } from "../screens/admin/EditSaleScreen";
import { CustomDrawerContent } from "./CustomDrawerContent";
import { useTheme } from "../theme/ThemeContext";
import { ReportsScreen } from "../screens/admin/ReportsScreen";
import { ExpensesScreen } from "../screens/admin/ExpensesScreen";

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

type IoniconsName = keyof typeof Ionicons.glyphMap;

function drawerIcon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export function AdminNavigator() {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Dashboard", drawerIcon: drawerIcon("grid-outline") }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductListScreen}
        options={{ title: "Products", drawerIcon: drawerIcon("cube-outline") }}
      />
      <Drawer.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{ title: "Product", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="Shops"
        component={ShopListScreen}
        options={{ title: "Shops", drawerIcon: drawerIcon("storefront-outline") }}
      />
      <Drawer.Screen
        name="ShopForm"
        component={ShopFormScreen}
        options={{ title: "Shop", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="Suppliers"
        component={SupplierListScreen}
        options={{ title: "Suppliers", drawerIcon: drawerIcon("business-outline") }}
      />
      <Drawer.Screen
        name="SupplierForm"
        component={SupplierFormScreen}
        options={{ title: "Supplier", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="SupplierReports"
        component={SupplierReportsScreen}
        options={{ title: "Supplier Reports", drawerIcon: drawerIcon("bar-chart-outline") }}
      />
      <Drawer.Screen
        name="SupplierPayments"
        component={SupplierPaymentsScreen}
        options={{ title: "Supplier Payments", drawerIcon: drawerIcon("card-outline") }}
      />
      <Drawer.Screen
        name="SupplierBilling"
        component={SupplierBillingScreen}
        options={{ title: "Supplier Billing", drawerIcon: drawerIcon("receipt-outline") }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "Reports", drawerIcon: drawerIcon("stats-chart-outline") }}
      />
      <Drawer.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ title: "Expenses", drawerIcon: drawerIcon("wallet-outline") }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="EditPayment"
        component={EditPaymentScreen}
        options={{
          title: "Edit Payment",
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="EditSale"
        component={EditSaleScreen}
        options={{ title: "Edit Sale", drawerItemStyle: { display: "none" } }}
      />
    </Drawer.Navigator>
  );
}
