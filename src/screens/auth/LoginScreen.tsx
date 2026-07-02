import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CustomButton, CustomInput, useToast } from "../../components";
import { authenticateUser, getDatabase } from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "../../store/slices/authSlice";
import { useTheme } from "../../theme/ThemeContext";
import { validateLogin } from "../../utils/validation";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "sales">("admin");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const validation = validateLogin(username, password);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    setLoading(true);
    dispatch(loginStart());
    try {
      await getDatabase();
      const user = await authenticateUser(username, password);
      if (user) {
        if (user.role !== selectedRole) {
          dispatch(
            loginFailure(
              `Use ${selectedRole === "admin" ? "admin" : "sales"} credentials`,
            ),
          );
          showToast(
            `This login is for ${selectedRole === "admin" ? "admin" : "sales"} users only`,
            "error",
          );
          return;
        }
        dispatch(loginSuccess({ user, rememberMe }));
        showToast("Login successful!");
        navigation.replace("RoleSelection", { role: selectedRole });
      } else {
        dispatch(loginFailure("Invalid username or password"));
        showToast("Invalid credentials", "error");
      }
    } catch {
      dispatch(loginFailure("Login failed"));
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>SD</Text>
          </View>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSub}>Sign in to your account</Text>
        </View>
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
          <View style={styles.roleSwitcher}>
            <Pressable
              style={[
                styles.roleButton,
                { borderColor: colors.primary },
                selectedRole === "admin" && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedRole("admin")}
            >
              <Text style={[styles.roleButtonText, { color: selectedRole === "admin" ? '#fff' : colors.textSecondary }]}>
                🏢 Admin
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.roleButton,
                { borderColor: colors.primary },
                selectedRole === "sales" && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedRole("sales")}
            >
              <Text style={[styles.roleButtonText, { color: selectedRole === "sales" ? '#fff' : colors.textSecondary }]}>
                💼 Sales
              </Text>
            </Pressable>
          </View>

          <CustomInput
            label="Username / Mobile"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            autoCapitalize="none"
            error={errors.username}
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry
            error={errors.password}
          />
          <Pressable
            style={styles.remember}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: colors.primary,
                  backgroundColor: rememberMe ? colors.primary : "transparent",
                },
              ]}
            >
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={{ color: colors.text }}>Remember Me</Text>
          </Pressable>
          <CustomButton title="Login" onPress={handleLogin} loading={loading} />
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Demo:{" "}
            {selectedRole === "admin" ? "admin/admin123" : "sales/sales123"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: { fontSize: 28, fontWeight: "800", color: "#fff" },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  form: {
    margin: 20,
    marginTop: -24,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  roleSwitcher: { flexDirection: "row", marginBottom: 20, gap: 8 },
  roleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  roleButtonText: { fontWeight: "700", fontSize: 13 },
  remember: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "700" },
  hint: { textAlign: "center", marginTop: 16, fontSize: 12 },
});
