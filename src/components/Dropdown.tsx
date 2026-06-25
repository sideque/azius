import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Option {
  label: string;
  value: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Dropdown({ label, options, value, onChange, placeholder = 'Select...' }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <Pressable onPress={() => setOpen(true)} style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: selected ? colors.text : colors.textMuted }}>{selected?.label ?? placeholder}</Text>
        <Text style={{ color: colors.textMuted }}>▼</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <View style={[styles.list, { backgroundColor: colors.surface }]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={{ color: colors.text, fontWeight: item.value === value ? '700' : '400' }}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  field: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' },
  overlay: { flex: 1, justifyContent: 'center', padding: 24 },
  list: { borderRadius: 12, maxHeight: 300, overflow: 'hidden' },
  option: { padding: 16 },
});
