import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CustomButton, CustomInput, useToast } from "../../components";
import { getShopById, getShops } from "../../services/database";
import { useAppDispatch } from "../../store/hooks";
import { addShop, editShop, removeShop } from "../../store/slices/shopSlice";
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
    creditLimit: "",
    openingBalance: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shopId) {
      getShopById(shopId).then((s) => {
        if (s)
          setForm({
            shopName: s.shopName,
            ownerName: s.ownerName,
            phoneNumber: s.phoneNumber,
            address: s.address,
            creditLimit: String(s.creditLimit),
            openingBalance: String(s.outstandingBalance ?? ""),
            notes: s.notes,
          });
      });
    }
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

      const startingBalance = parseFloat(form.openingBalance) || 0;
      const data = {
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim(),
        creditLimit: parseFloat(form.creditLimit),
        outstandingBalance: startingBalance,
        openingBalance: startingBalance,
        notes: form.notes.trim(),
      };

      if (isEdit && shopId) {
        await dispatch(editShop({ id: shopId, shop: data })).unwrap();
        showToast("Shop updated");
      } else {
        await dispatch(addShop(data)).unwrap();
        showToast("Shop created");
      }

      navigation.navigate("Shops" as never);
      setForm({
        shopName: "",
        ownerName: "",
        phoneNumber: "",
        address: "",
        creditLimit: "",
        openingBalance: "",
        notes: "",
      });
    } catch (error) {
      showToast("Failed to save shop", "error");
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (shopId) {
      await dispatch(removeShop(shopId));
      showToast("Shop deleted");
      navigation.navigate("Shops" as never);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <CustomInput
        label="Shop Name"
        value={form.shopName}
        onChangeText={(v) => update("shopName", v)}
        error={errors.shopName}
      />
      <CustomInput
        label="Owner Name"
        value={form.ownerName}
        onChangeText={(v) => update("ownerName", v)}
        error={errors.ownerName}
      />
      <CustomInput
        label="Phone Number"
        value={form.phoneNumber}
        onChangeText={(v) => update("phoneNumber", v)}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
      />
      <CustomInput
        label="Address"
        value={form.address}
        onChangeText={(v) => update("address", v)}
        error={errors.address}
      />
      <CustomInput
        label="Credit Limit"
        value={form.creditLimit}
        onChangeText={(v) => update("creditLimit", v)}
        keyboardType="decimal-pad"
        error={errors.creditLimit}
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
      {isEdit && (
        <CustomButton
          title="Delete Shop"
          onPress={handleDelete}
          variant="danger"
          style={{ marginTop: 12 }}
        />
      )}
      <CustomButton
        title="Back to Shops"
        onPress={() => {
          navigation.navigate("Shops" as never);
          setForm({
            shopName: "",
            ownerName: "",
            phoneNumber: "",
            address: "",
            creditLimit: "",
            openingBalance: "",
            notes: "",
          });
        }}
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
