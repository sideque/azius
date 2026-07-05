import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './src/store';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ToastProvider } from './src/components';
import { RootNavigator } from './src/navigation/RootNavigator';

const NAV_STATE_KEY = '@navigation_state';

function AppContent() {
  const { colors, isDark } = useTheme();
  const [isNavReady, setIsNavReady] = useState(false);
  const [initialNavState, setInitialNavState] = useState<NavigationState | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const [savedNavState, savedUser] = await Promise.all([
          AsyncStorage.getItem(NAV_STATE_KEY),
          AsyncStorage.getItem('@auth_user'),
        ]);
        // Only restore the last screen if there's still a logged-in user -
        // otherwise it could drop a logged-out user back into a protected screen.
        if (savedNavState && savedUser) {
          setInitialNavState(JSON.parse(savedNavState));
        }
      } catch (error) {
        console.log('Failed to restore navigation state:', error);
      } finally {
        setIsNavReady(true);
      }
    })();
  }, []);

  const handleStateChange = useCallback((state: NavigationState | undefined) => {
    AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state)).catch(() => {});
  }, []);

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

  if (!isNavReady) {
    return null;
  }

  return (
    <NavigationContainer
      theme={navTheme}
      initialState={initialNavState}
      onStateChange={handleStateChange}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
