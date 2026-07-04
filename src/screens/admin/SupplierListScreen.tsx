import React, { useCallback } from "react";
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
import { EmptyState, LoadingSkeleton, SearchBar } from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchSuppliers, setSearch } from "../../store/slices/supplierSlice";
import { useTheme } from "../../theme/ThemeContext";
import { AdminDrawerParamList } from "../../navigation/types";
import { SupplierCard } from "../../components/Cards";

export function SupplierListScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { items, loading, search } = useAppSelector((s) => s.suppliers);

  const load = useCallback(() => dispatch(fetchSuppliers()), [dispatch]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
            />
          )}
        />
      )}
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
