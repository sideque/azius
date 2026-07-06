// import 'react-native-gesture-handler';
// import React, { useCallback, useEffect, useState } from 'react';
// import { StatusBar } from 'expo-status-bar';
// import { Provider } from 'react-redux';
// import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState } from '@react-navigation/native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { store } from './src/store';
// import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
// import { ToastProvider } from './src/components';
// import { RootNavigator } from './src/navigation/RootNavigator';

// const NAV_STATE_KEY = '@navigation_state';

// function AppContent() {
//   const { colors, isDark } = useTheme();
//   const [isNavReady, setIsNavReady] = useState(false);
//   const [initialNavState, setInitialNavState] = useState<NavigationState | undefined>();

//   useEffect(() => {
//     (async () => {
//       try {
//         const [savedNavState, savedUser] = await Promise.all([
//           AsyncStorage.getItem(NAV_STATE_KEY),
//           AsyncStorage.getItem('@auth_user'),
//         ]);
//         // Only restore the last screen if there's still a logged-in user -
//         // otherwise it could drop a logged-out user back into a protected screen.
//         if (savedNavState && savedUser) {
//           setInitialNavState(JSON.parse(savedNavState));
//         }
//       } catch (error) {
//         console.log('Failed to restore navigation state:', error);
//       } finally {
//         setIsNavReady(true);
//       }
//     })();
//   }, []);

//   const handleStateChange = useCallback((state: NavigationState | undefined) => {
//     AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state)).catch(() => {});
//   }, []);

//   const navTheme = {
//     ...(isDark ? DarkTheme : DefaultTheme),
//     colors: {
//       ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
//       primary: colors.primary,
//       background: colors.background,
//       card: colors.surface,
//       text: colors.text,
//       border: colors.border,
//     },
//   };

//   if (!isNavReady) {
//     return null;
//   }

//   return (
//     <NavigationContainer
//       theme={navTheme}
//       initialState={initialNavState}
//       onStateChange={handleStateChange}
//     >
//       <StatusBar style={isDark ? 'light' : 'dark'} />
//       <RootNavigator />
//     </NavigationContainer>
//   );
// }

// export default function App() {
//   return (
//     <Provider store={store}>
//       <SafeAreaProvider>
//         <ThemeProvider>
//           <ToastProvider>
//             <AppContent />
//           </ToastProvider>
//         </ThemeProvider>
//       </SafeAreaProvider>
//     </Provider>
//   );
// }

import "react-native-gesture-handler";
import "react-native-get-random-values";

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  NavigationState,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

import { store } from "./src/store";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { ToastProvider } from "./src/components";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { checkUserAccess } from "./src/services/checkAccess";

const NAV_STATE_KEY = "@navigation_state";

/* =========================
   DEVICE ID
========================= */
const getDeviceId = async () => {
  let id = await AsyncStorage.getItem("device_id");

  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem("device_id", id);
  }

  return id;
};

function AppContent() {
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const [isNavReady, setIsNavReady] = useState(false);
  const [initialNavState, setInitialNavState] =
    useState<NavigationState | undefined>();

  /* =========================
     DEVICE CHECK
  ========================= */
  useEffect(() => {
    (async () => {
      try {
        const deviceId = await getDeviceId();

        console.log("Device ID:", deviceId);

        const user = await checkUserAccess(deviceId);

        const allowed =
          user?.isActive === true &&
          user?.isBlocked !== true;

        setIsActive(allowed);
      } catch (error) {
        console.log("Access error:", error);
        setIsActive(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* =========================
     RESTORE NAVIGATION
  ========================= */
  useEffect(() => {
    (async () => {
      try {
        const [savedNavState, savedUser] = await Promise.all([
          AsyncStorage.getItem(NAV_STATE_KEY),
          AsyncStorage.getItem("@auth_user"),
        ]);

        if (savedNavState && savedUser) {
          setInitialNavState(JSON.parse(savedNavState));
        }
      } catch (error) {
        console.log("Navigation restore error:", error);
      } finally {
        setIsNavReady(true);
      }
    })();
  }, []);

  const handleStateChange = useCallback(
    (state: NavigationState | undefined) => {
      AsyncStorage.setItem(
        NAV_STATE_KEY,
        JSON.stringify(state)
      ).catch(() => {});
    },
    []
  );

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>
          Checking device access...
        </Text>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          App Disabled
        </Text>

        <Text>Please contact the administrator.</Text>
      </View>
    );
  }

  if (!isNavReady) {
    return null;
  }

  return (
    <NavigationContainer
      theme={navTheme}
      initialState={initialNavState}
      onStateChange={handleStateChange}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}