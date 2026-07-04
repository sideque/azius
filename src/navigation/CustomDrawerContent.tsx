import React from "react";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useTheme } from "../theme/ThemeContext";

export function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const goToLogin = () => {
    dispatch(logout());
    props.navigation
      .getParent()
      ?.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
      );
  };

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.background }}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatar}>{user?.name?.charAt(0) ?? "A"}</Text>
        <Text style={styles.name}>{user?.name ?? "Admin"}</Text>
        <Text style={styles.role}>Administrator</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Switch to Sales Panel"
        icon={({ size }) => (
          <Ionicons name="swap-horizontal-outline" size={size} color={colors.secondary} />
        )}
        onPress={() => props.navigation.getParent()?.navigate("SalesApp")}
        labelStyle={{ color: colors.secondary }}
      />
      <DrawerItem
        label="Logout"
        icon={({ size }) => (
          <Ionicons name="log-out-outline" size={size} color={colors.error} />
        )}
        onPress={goToLogin}
        labelStyle={{ color: colors.error }}
      />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: 24, 
    paddingTop: 56, 
    marginBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16, // squircle avatar
    backgroundColor: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 56,
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    overflow: "hidden",
  },
  name: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 14, letterSpacing: -0.2 },
  role: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600", marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.8 },
});
