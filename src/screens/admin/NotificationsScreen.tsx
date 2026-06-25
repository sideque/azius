import React, { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markAllRead, markNotificationRead } from '../../store/slices/settingsSlice';
import { useTheme } from '../../theme/ThemeContext';
import { formatDateTime } from '../../utils/formatters';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.settings.notifications);

  const load = useCallback(() => dispatch(fetchNotifications()), [dispatch]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const typeIcon = { low_stock: '📦', outstanding: '⚠️', payment_due: '💳' };
  const typeColor = { low_stock: colors.warning, outstanding: colors.error, payment_due: colors.info };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {notifications.length > 0 && (
        <Pressable onPress={() => dispatch(markAllRead())} style={styles.markAll}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Mark all as read</Text>
        </Pressable>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState title="No Notifications" message="You're all caught up!" icon="🔔" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => dispatch(markNotificationRead(item.id))}
            style={[styles.card, { backgroundColor: item.read ? colors.surface : colors.primaryLight, borderColor: colors.border }]}
          >
            <Text style={styles.icon}>{typeIcon[item.type]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: typeColor[item.type] }]}>{item.title}</Text>
              <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }}>{item.message}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 6 }}>{formatDateTime(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  markAll: { alignSelf: 'flex-end', marginBottom: 12 },
  card: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  icon: { fontSize: 28, marginRight: 14 },
  title: { fontSize: 14, fontWeight: '700' },
});
