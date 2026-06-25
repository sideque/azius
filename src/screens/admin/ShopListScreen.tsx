import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, LoadingSkeleton, SearchBar, ShopCard } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchShops, setSearch } from '../../store/slices/shopSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AdminDrawerParamList } from '../../navigation/types';

export function ShopListScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<AdminDrawerParamList>>();
  const { items, loading, search } = useAppSelector((s) => s.shops);

  const load = useCallback(() => dispatch(fetchShops()), [dispatch]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SearchBar value={search} onChangeText={(t) => { dispatch(setSearch(t)); setTimeout(() => dispatch(fetchShops()), 300); }} placeholder="Search shops..." />
      <Pressable style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('ShopForm', {})}>
        <Text style={styles.addText}>+ Add Shop</Text>
      </Pressable>
      {loading && items.length === 0 ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState title="No Shops" message="Add your first shop" icon="🏪" />}
          renderItem={({ item }) => (
            <ShopCard shop={item} onPress={() => navigation.navigate('ShopForm', { shopId: item.id })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  addBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
