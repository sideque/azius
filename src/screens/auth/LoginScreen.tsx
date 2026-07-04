import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CustomButton, CustomInput, useToast } from "../../components";
import { authenticateUser, getDatabase } from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "../../store/slices/authSlice";
import { validateLogin } from "../../utils/validation";
import { AuthStackParamList } from "../../navigation/types";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 360;
const isTablet = SCREEN_WIDTH >= 768;

// Premium green + gold palette (matches SplashScreen)
const THEME = {
  gradientStart: "#052E22",
  gradientMid: "#0B7A5B",
  gradientEnd: "#10A375",
  gold: "#C9A24B",
  surface: "#FFFFFF",
  text: "#0F2A22",
  textSecondary: "#5B7B70",
  textMuted: "#8FA79D",
  background: "#F4F9F7",
};

export function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "sales">("admin");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // const handleLogin = async () => {
  //   const validation = validateLogin(username, password);
  //   setErrors(validation.errors);
  //   if (!validation.isValid) return;

  //   setLoading(true);
  //   dispatch(loginStart());
  //   try {
  //     await getDatabase();
  //     const user = await authenticateUser(username, password);
  //     console.log(user, "user");
  //     if (user) {
  //       if (user.role !== selectedRole) {
  //         dispatch(
  //           loginFailure(
  //             `Use ${selectedRole === "admin" ? "admin" : "sales"} credentials`,
  //           ),
  //         );
  //         showToast(
  //           `This login is for ${selectedRole === "admin" ? "admin" : "sales"} users only`,
  //           "error",
  //         );
  //         return;
  //       }
  //       dispatch(loginSuccess({ user, rememberMe }));
  //       showToast("Login successful!");
  //       navigation.replace("RoleSelection", { role: selectedRole });
  //     } else {
  //       dispatch(loginFailure("Invalid username or password"));
  //       showToast("Invalid credentials", "error");
  //     }
  //   } catch {
  //     dispatch(loginFailure("Login failed"));
  //     showToast("Something went wrong", "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleLogin = async () => {
    const validation = validateLogin(username, password);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    setLoading(true);
    dispatch(loginStart());

    try {
      // 1. Firebase Authentication login
      const result = await signInWithEmailAndPassword(auth, username, password);
      const uid = result.user.uid;

      // 2. Get user role from Firestore
      const userSnap = await getDoc(doc(db, "users", uid));

      if (!userSnap.exists()) {
        throw new Error("User profile not found");
      }

      // const userData = userSnap.data();
      const data = userSnap.data();

      const user = {
        id: uid,
        username: data.username,
        role: data.role,
      };

      // 3. Role check
      // if (userData.role !== selectedRole) {
      //   dispatch(loginFailure(`Use ${selectedRole} credentials`));
      //   showToast(`This login is for ${selectedRole} only`, "error");
      //   return;
      // }

      // 4. Success
      dispatch(loginSuccess({ user, rememberMe }));
      showToast("Login successful!");
      navigation.replace("RoleSelection", { role: selectedRole });
    } catch (error) {
      console.log(error);
      dispatch(loginFailure("Login failed"));
      showToast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[THEME.gradientStart, THEME.gradientMid, THEME.gradientEnd]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.header}
        >
          {/* decorative glow circles */}
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          <View style={styles.logoRing}>
            <LinearGradient
              colors={["#FFFFFF", "#D9F2E6"]}
              style={styles.logoCircle}
            >
              <Text style={styles.logo}>SM</Text>
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerSub}>Sign in to your account</Text>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.roleSwitcher}>
            <Pressable
              style={[
                styles.roleButton,
                selectedRole === "admin" && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole("admin")}
            >
              <View style={styles.roleButtonContent}>
                <Ionicons
                  name="business-outline"
                  size={15}
                  color={selectedRole === "admin" ? "#fff" : THEME.textSecondary}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "admin" && styles.roleButtonTextActive,
                  ]}
                >
                  Admin
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[
                styles.roleButton,
                selectedRole === "sales" && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole("sales")}
            >
              <View style={styles.roleButtonContent}>
                <Ionicons
                  name="briefcase-outline"
                  size={15}
                  color={selectedRole === "sales" ? "#fff" : THEME.textSecondary}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    selectedRole === "sales" && styles.roleButtonTextActive,
                  ]}
                >
                  Sales
                </Text>
              </View>
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
              style={[styles.checkbox, rememberMe && styles.checkboxActive]}
            >
              {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.rememberText}>Remember Me</Text>
          </Pressable>

          <CustomButton title="Login" onPress={handleLogin} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const LOGO_SIZE = isTablet ? 90 : isSmallDevice ? 64 : 76;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  scroll: { flexGrow: 1 },

  header: {
    paddingTop: isTablet ? 100 : 70,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: "center",
    overflow: "hidden",
  },
  glowTop: {
    position: "absolute",
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.25,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -SCREEN_WIDTH * 0.35,
    left: -SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  logoRing: {
    width: LOGO_SIZE + 14,
    height: LOGO_SIZE + 14,
    borderRadius: (LOGO_SIZE + 14) / 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: THEME.gold,
  },
  logo: {
    fontSize: LOGO_SIZE * 0.36,
    fontWeight: "800",
    color: THEME.gradientMid,
    letterSpacing: 1,
  },

  headerTitle: {
    fontSize: isTablet ? 32 : isSmallDevice ? 22 : 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  headerDivider: {
    width: 32,
    height: 2,
    backgroundColor: THEME.gold,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 1,
  },
  headerSub: {
    fontSize: isTablet ? 16 : 13,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  form: {
    margin: 20,
    marginTop: -28,
    borderRadius: 22,
    padding: 24,
    backgroundColor: THEME.surface,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },

  roleSwitcher: { flexDirection: "row", marginBottom: 20, gap: 10 },
  roleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: THEME.gradientMid,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  roleButtonActive: {
    backgroundColor: THEME.gradientMid,
    borderColor: THEME.gold,
  },
  roleButtonContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleButtonText: {
    fontWeight: "700",
    fontSize: 13,
    color: THEME.textSecondary,
  },
  roleButtonTextActive: {
    color: "#fff",
  },

  remember: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.gradientMid,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxActive: {
    backgroundColor: THEME.gold,
    borderColor: THEME.gold,
  },
  rememberText: { color: THEME.text, fontSize: 14 },

  hint: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 12,
    color: THEME.textMuted,
  },
});
