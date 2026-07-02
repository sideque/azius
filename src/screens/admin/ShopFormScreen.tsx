import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { CustomButton, CustomInput, useToast } from "../../components";
import { getShopById } from "../../services/database";
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

    try {
      if (isEdit && shopId) {
        await dispatch(editShop({ id: shopId, shop: data }));
        showToast("Shop updated");
      } else {
        await dispatch(addShop(data));
        showToast("Shop created");
      }
      navigation.goBack();
    } catch {
      showToast("Failed to save shop", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (shopId) {
      await dispatch(removeShop(shopId));
      showToast("Shop deleted");
      navigation.goBack();
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
        onPress={() => navigation.navigate("Shops" as never)}
        variant="secondary"
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
