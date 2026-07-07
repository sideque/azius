import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CustomButton, CustomInput, useToast } from "../../components";
import { getShopById, getShops } from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import { addShop, editShop } from "../../store/slices/shopSlice";
import { useTheme } from "../../theme/ThemeContext";
import { validateShop } from "../../utils/validation";
import { AdminDrawerParamList } from "../../navigation/types";
export function ShopFormScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<AdminDrawerParamList, "ShopForm">>();
  const shopId = route.params?.shopId;
  const isEdit = !!shopId;

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phoneNumber: "",
    address: "",
    openingBalance: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [creditLimit, setCreditLimit] = useState(0);
  // loadingShop = true means we are fetching from Firestore right now
  const [loadingShop, setLoadingShop] = useState(isEdit);
  const [originalShop, setOriginalShop] = useState<any>(null);

  useEffect(() => {
    if (shopId) {
      let cancelled = false;
      // Always fetch fresh data from Firestore - never rely on cached store
      setLoadingShop(true);
      getShopById(shopId)
        .then((s) => {
          if (cancelled) return;
          if (s) {
            setOriginalShop(s);
            setForm({
              shopName: s.shopName,
              ownerName: s.ownerName,
              phoneNumber: s.phoneNumber,
              address: s.address,
              openingBalance: String(s.openingBalance ?? ""),
              notes: s.notes,
            });
            setCreditLimit(s.creditLimit);
          } else {
            showToast("Shop not found", "error");
          }
        })
        .catch(() => {
          if (!cancelled) showToast("Failed to load shop details", "error");
        })
        .finally(() => {
          if (!cancelled) setLoadingShop(false);
        });
      return () => {
        cancelled = true;
      };
    }
    // Creating new shop — reset everything
    setForm({
      shopName: "",
      ownerName: "",
      phoneNumber: "",
      address: "",
      openingBalance: "",
      notes: "",
    });
    setCreditLimit(0);
    setOriginalShop(null);
    setErrors({});
    setLoadingShop(false);
  }, [shopId]);

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    const validation = validateShop(form);
    setErrors(validation.errors);

    if (!validation.isValid) return;

    setLoading(true);

    try {
      const existingShops = await getShops();

      // Check duplicate shop name
      const duplicateShop = existingShops.find(
        (shop) =>
          shop.shopName.trim().toLowerCase() ===
          form.shopName.trim().toLowerCase() &&
          (!isEdit || shop.id !== shopId),
      );

      if (duplicateShop) {
        setErrors((prev) => ({
          ...prev,
          shopName: "Shop name already exists",
        }));
        showToast("Shop name already exists", "error");
        setLoading(false);
        return;
      }

      // Optional: Check duplicate phone number
      const duplicatePhone = existingShops.find(
        (shop) =>
          shop.phoneNumber.trim() === form.phoneNumber.trim() &&
          (!isEdit || shop.id !== shopId),
      );

      if (duplicatePhone) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "Phone number already exists",
        }));
        showToast("Phone number already exists", "error");
        setLoading(false);
        return;
      }

      if (isEdit && shopId && originalShop) {
        const newOpeningBalance = parseFloat(form.openingBalance) || 0;
        const oldOpeningBalance = originalShop.openingBalance ?? 0;
        const oldOutstandingBalance = originalShop.outstandingBalance ?? 0;

        const updateData: any = {
          shopName: form.shopName.trim(),
          ownerName: form.ownerName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim(),
          creditLimit,
          notes: form.notes.trim(),
        };

        if (newOpeningBalance !== oldOpeningBalance) {
          const diff = newOpeningBalance - oldOpeningBalance;
          updateData.openingBalance = newOpeningBalance;
          updateData.outstandingBalance = oldOutstandingBalance + diff;
        }

        await dispatch(editShop({ id: shopId, shop: updateData })).unwrap();
        showToast("Shop updated");
      } else {
        const startingBalance = parseFloat(form.openingBalance) || 0;
        const data = {
          shopName: form.shopName.trim(),
          ownerName: form.ownerName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim(),
          creditLimit,
          outstandingBalance: startingBalance,
          openingBalance: startingBalance,
          notes: form.notes.trim(),
        };
        await dispatch(addShop(data)).unwrap();
        showToast("Shop created");
      }

      navigation.navigate("Shops" as never);
      setForm({
        shopName: "",
        ownerName: "",
        phoneNumber: "",
        address: "",
        openingBalance: "",
        notes: "",
      });
      setCreditLimit(0);
    } catch (error) {
      showToast("Failed to save shop", "error");
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };
  // Show full-screen loader while fetching shop data from Firestore
  if (isEdit && loadingShop) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading shop details...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <CustomInput
          label="Shop Name"
          value={form.shopName}
          onChangeText={(v) => update("shopName", v)}
          error={errors.shopName}
        />
        <View style={styles.row}>
          <View style={styles.col}>
            <CustomInput
              label="Owner Name"
              value={form.ownerName}
              onChangeText={(v) => update("ownerName", v)}
              error={errors.ownerName}
            />
          </View>
          <View style={styles.col}>
            <CustomInput
              label="Phone Number"
              value={form.phoneNumber}
              onChangeText={(v) => update("phoneNumber", v)}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />
          </View>
        </View>
        <CustomInput
          label="Address"
          value={form.address}
          onChangeText={(v) => update("address", v)}
          error={errors.address}
        />
        <CustomInput
          label="Opening Balance"
          value={form.openingBalance}
          onChangeText={(v) => update("openingBalance", v)}
          keyboardType="decimal-pad"
        />
        <CustomInput
          label="Notes"
          value={form.notes}
          onChangeText={(v) => update("notes", v)}
          multiline
          numberOfLines={3}
        />
        <CustomButton
          title={isEdit ? "Update Shop" : "Create Shop"}
          onPress={handleSave}
          loading={loading}
        />
        <CustomButton
          title="Back to Shops"
          onPress={() => {
            navigation.navigate("Shops" as never);
            setForm({
              shopName: "",
              ownerName: "",
              phoneNumber: "",
              address: "",
              openingBalance: "",
              notes: "",
            });
            setCreditLimit(0);
          }}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: "500" },
});
