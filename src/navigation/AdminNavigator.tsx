import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
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

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

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
        options={{ title: "Dashboard" }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductListScreen}
        options={{ title: "Products" }}
      />
      <Drawer.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={{ title: "Product", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="Shops"
        component={ShopListScreen}
        options={{ title: "Shops" }}
      />
      <Drawer.Screen
        name="ShopForm"
        component={ShopFormScreen}
        options={{ title: "Shop", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="Suppliers"
        component={SupplierListScreen}
        options={{ title: "Suppliers" }}
      />
      <Drawer.Screen
        name="SupplierForm"
        component={SupplierFormScreen}
        options={{ title: "Supplier", drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="SupplierReports"
        component={SupplierReportsScreen}
        options={{ title: "Supplier Reports" }}
      />
      <Drawer.Screen
        name="SupplierPayments"
        component={SupplierPaymentsScreen}
        options={{ title: "Supplier Payments" }}
      />
      <Drawer.Screen
        name="SupplierBilling"
        component={SupplierBillingScreen}
        options={{ title: "Supplier Billing" }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "Reports" }}
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
