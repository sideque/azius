import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
  ConfirmationDialog,
  EmptyState,
  LoadingSkeleton,
  SearchBar,
  useToast,
} from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchSuppliers,
  removeSupplier,
  setSearch,
} from "../../store/slices/supplierSlice";
import { useTheme } from "../../theme/ThemeContext";
import { AdminDrawerParamList } from "../../navigation/types";
import { SupplierCard } from "../../components/Cards";

export function SupplierListScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { showToast } = useToast();
  const { items, loading, search } = useAppSelector((s) => s.suppliers);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => dispatch(fetchSuppliers()), [dispatch]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async () => {
    if (deleteId) {
      await dispatch(removeSupplier(deleteId));
      showToast("Supplier deleted");
      setDeleteId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar
        value={search}
        onChangeText={(text) => {
          dispatch(setSearch(text));
          setTimeout(() => dispatch(fetchSuppliers()), 300);
        }}
        placeholder="Search suppliers..."
      />
      <Pressable
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("SupplierForm", {})}
      >
        <Text style={styles.addText}>+ Add Supplier</Text>
      </Pressable>
      {loading && items.length === 0 ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Suppliers"
              message="Add your first supplier"
              icon="business-outline"
            />
          }
          renderItem={({ item }) => (
            <SupplierCard
              supplier={item}
              onPress={() =>
                navigation.navigate("SupplierForm", { supplierId: item.id })
              }
              onDelete={() => setDeleteId(item.id)}
            />
          )}
        />
      )}
      <ConfirmationDialog
        visible={!!deleteId}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  addBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },
});
