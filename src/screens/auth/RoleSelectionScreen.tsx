import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CustomButton } from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "RoleSelection">;

export function RoleSelectionScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const role = route.params?.role ?? "admin";
  const isAdmin = role === "admin";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isAdmin ? "Admin Panel" : "Sales Panel"}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isAdmin
          ? "Continue to the admin dashboard"
          : "Continue to the sales workspace"}
      </Text>
      <CustomButton
        title={isAdmin ? "Open Admin Panel" : "Open Sales Panel"}
        onPress={() => navigation.replace(isAdmin ? "AdminApp" : "SalesApp")}
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  btn: { marginBottom: 16 },
});
