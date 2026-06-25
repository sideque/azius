import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from './types';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { AdminNavigator } from './AdminNavigator';
import { SalesNavigator } from './SalesNavigator';
import { useAppDispatch } from '../store/hooks';
import { restoreSession, setInitialized } from '../store/slices/authSlice';
import { getDatabase } from '../services/database';
import { User } from '../types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList>('Login');

  useEffect(() => {
    (async () => {
      await getDatabase();
      const saved = await AsyncStorage.getItem('@auth_user');
      if (saved) {
        dispatch(restoreSession(JSON.parse(saved) as User));
        setInitialRoute('RoleSelection');
      } else {
        dispatch(setInitialized());
      }
    })();
  }, [dispatch]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="AdminApp" component={AdminNavigator} />
      <Stack.Screen name="SalesApp" component={SalesNavigator} />
    </Stack.Navigator>
  );
}
