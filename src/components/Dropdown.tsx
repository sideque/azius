import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

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
  error?: string;
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  error,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value);
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <Pressable
        onPress={() => {
          setSearch("");
          setOpen(true);
        }}
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted }}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={{ color: colors.textMuted }}>▼</Text>
      </Pressable>
      {/* <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
        >
          <View style={[styles.list, { backgroundColor: colors.surface }]}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.searchInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.value === value && {
                      backgroundColor: colors.primaryLight,
                    },
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: item.value === value ? "700" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal> */}
      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={() => {}}>
            <View style={[styles.list, { backgroundColor: colors.surface }]}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.searchInput,
                  {
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
              />

              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) =>
                  `${item.value || item.label}-${index}`
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.option,
                      item.value === value && {
                        backgroundColor: colors.primaryLight,
                      },
                    ]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: item.value === value ? "700" : "400",
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 12,
  },
  overlay: { flex: 1, justifyContent: "center", padding: 24 },
  list: { borderRadius: 12, maxHeight: 300, overflow: "hidden" },
  option: { padding: 16 },
});
