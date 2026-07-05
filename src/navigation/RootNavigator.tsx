import React, { useCallback, useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthStackParamList } from "./types";
import { SplashScreen } from "../screens/auth/SplashScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RoleSelectionScreen } from "../screens/auth/RoleSelectionScreen";
import { AdminNavigator } from "./AdminNavigator";
import { SalesNavigator } from "./SalesNavigator";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { restoreSession, setInitialized } from "../store/slices/authSlice";
import { getDatabase } from "../services/database";
import { User } from "../types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.auth.initialized);
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] =
    useState<keyof AuthStackParamList>("Login");

  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
      } catch (error) {
        console.log("getDatabase failed during startup:", error);
      }

      try {
        const saved = await AsyncStorage.getItem("@auth_user");
        if (saved) {
          const user = JSON.parse(saved) as User;
          dispatch(restoreSession(user));
          setInitialRoute(user.role === "admin" ? "AdminApp" : "SalesApp");
          return;
        }
      } catch (error) {
        console.log("Session restore failed:", error);
      }
      dispatch(setInitialized());
    })();
  }, [dispatch]);

  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  if (showSplash || !initialized) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="AdminApp" component={AdminNavigator} />
      <Stack.Screen name="SalesApp" component={SalesNavigator} />
    </Stack.Navigator>
  );
}
