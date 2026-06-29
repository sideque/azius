import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, Text } from "react-native";
import { SalesTabParamList } from "./types";
import { CreateSaleScreen } from "../screens/sales/CreateSaleScreen";
import { CollectPaymentScreen } from "../screens/sales/CollectPaymentScreen";
import { ShopLedgerScreen } from "../screens/sales/ShopLedgerScreen";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useTheme } from "../theme/ThemeContext";

const Tab = createBottomTabNavigator<SalesTabParamList>();

function TabIcon({
  label,
  focused,
  color,
}: {
  label: string;
  focused: boolean;
  color: string;
}) {
  const icons: Record<string, string> = {
    CreateSale: "🛒",
    CollectPayment: "💰",
    ShopLedger: "📒",
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, color }}>
      {icons[label] ?? "•"}
    </Text>
  );
}

export function SalesNavigator() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    dispatch(logout());
    await AsyncStorage.removeItem("@auth_user");
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
    );
  };

  const handleSwitchToAdmin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      }),
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon label={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerRight: () => (
          <>
            <Pressable
              onPress={handleSwitchToAdmin}
              style={{ marginRight: 12 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Admin</Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={{ marginRight: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Logout</Text>
            </Pressable>
          </>
        ),
      })}
    >
      <Tab.Screen
        name="CreateSale"
        component={CreateSaleScreen}
        options={{ title: "Create Sale", tabBarLabel: "Create Sale" }}
      />
      <Tab.Screen
        name="CollectPayment"
        component={CollectPaymentScreen}
        options={{ title: "Collect Payment", tabBarLabel: "Payment" }}
      />
      <Tab.Screen
        name="ShopLedger"
        component={ShopLedgerScreen}
        options={{ title: "Shop Ledger", tabBarLabel: "Ledger" }}
      />
    </Tab.Navigator>
  );
}
