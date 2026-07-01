import React from "react";
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
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
        onPress={() => props.navigation.getParent()?.navigate("SalesApp")}
        labelStyle={{ color: colors.secondary }}
      />
      <DrawerItem
        label="Logout"
        onPress={goToLogin}
        labelStyle={{ color: colors.error }}
      />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 24, paddingTop: 48, marginBottom: 8 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    textAlign: "center",
    lineHeight: 56,
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    overflow: "hidden",
  },
  name: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 12 },
  role: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
});
