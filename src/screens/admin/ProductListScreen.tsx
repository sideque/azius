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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ConfirmationDialog,
  EmptyState,
  LoadingSkeleton,
  ProductCard,
  SearchBar,
} from "../../components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchCategories,
  fetchProducts,
  removeProduct,
  setCategoryFilter,
  setSearch,
} from "../../store/slices/productSlice";
import { useTheme } from "../../theme/ThemeContext";
import { AdminDrawerParamList } from "../../navigation/types";
import { useToast } from "../../components";

export function ProductListScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminDrawerParamList>>();
  const { showToast } = useToast();
  const { items, loading, search, categories, categoryFilter } = useAppSelector(
    (s) => s.products,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSearch = (text: string) => {
    dispatch(setSearch(text));
    setTimeout(() => dispatch(fetchProducts()), 300);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await dispatch(removeProduct(deleteId));
      showToast("Product deleted");
      setDeleteId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar
        value={search}
        onChangeText={handleSearch}
        placeholder="Search products..."
      />
      <View style={styles.filters}>
        {["All"].map((cat) => (
          <Pressable
            key={cat}
            onPress={() => {
              dispatch(setCategoryFilter(cat));
              dispatch(fetchProducts());
            }}
            style={[
              styles.chip,
              {
                backgroundColor:
                  categoryFilter === cat ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: categoryFilter === cat ? "#fff" : colors.text,
                fontSize: 12,
              }}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("ProductForm", {})}
      >
        <Text style={styles.addText}>+ Add Product</Text>
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
              title="No Products"
              message="Add your first product"
              icon="cube-outline"
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate("ProductForm", { productId: item.id })
              }
              onDelete={() => setDeleteId(item.id)}
            />
          )}
        />
      )}
      <ConfirmationDialog
        visible={!!deleteId}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filters: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12, gap: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0.5,
  },
  addBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  addText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
