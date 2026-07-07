import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConfirmationDialog, EmptyState, LoadingSkeleton, SearchBar, ShopCard, useToast } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchShops, removeShop, setSearch } from '../../store/slices/shopSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AdminDrawerParamList } from '../../navigation/types';
import { Shop } from '../../types';

export function ShopListScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<AdminDrawerParamList>>();
  const { items, loading, search } = useAppSelector((s) => s.shops);
  const [pendingDelete, setPendingDelete] = useState<Shop | null>(null);

  const load = useCallback(() => dispatch(fetchShops()), [dispatch]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (shop: Shop) => {
    setPendingDelete(shop);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const shop = pendingDelete;
    setPendingDelete(null);
    try {
      await dispatch(removeShop(shop.id)).unwrap();
      showToast('Shop deleted');
    } catch (error) {
      showToast('Failed to delete shop', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar value={search} onChangeText={(t) => { dispatch(setSearch(t)); setTimeout(() => dispatch(fetchShops()), 300); }} placeholder="Search shops..." />
      <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ShopForm', { shopId: undefined })}>
        <Text style={styles.addText}>+ Add Shop</Text>
      </Pressable>
      {loading && items.length === 0 ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState title="No Shops" message="Add your first shop" icon="storefront-outline" />}
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={() => navigation.navigate('ShopForm', { shopId: item.id })}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <ConfirmationDialog
        visible={!!pendingDelete}
        title="Delete Shop"
        message={`Are you sure you want to delete "${pendingDelete?.shopName}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
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
    alignItems: 'center', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
});
