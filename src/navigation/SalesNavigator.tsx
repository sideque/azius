import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SalesTabParamList } from './types';
import { CreateSaleScreen } from '../screens/sales/CreateSaleScreen';
import { CollectPaymentScreen } from '../screens/sales/CollectPaymentScreen';
import { ShopLedgerScreen } from '../screens/sales/ShopLedgerScreen';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator<SalesTabParamList>();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = { CreateSale: '🛒', CollectPayment: '💰', ShopLedger: '📒' };
  return <Text style={{ fontSize: focused ? 22 : 20, color }}>{icons[label] ?? '•'}</Text>;
}

export function SalesNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => <TabIcon label={route.name} focused={focused} color={color} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      })}
    >
      <Tab.Screen name="CreateSale" component={CreateSaleScreen} options={{ title: 'Create Sale', tabBarLabel: 'Create Sale' }} />
      <Tab.Screen name="CollectPayment" component={CollectPaymentScreen} options={{ title: 'Collect Payment', tabBarLabel: 'Payment' }} />
      <Tab.Screen name="ShopLedger" component={ShopLedgerScreen} options={{ title: 'Shop Ledger', tabBarLabel: 'Ledger' }} />
    </Tab.Navigator>
  );
}
