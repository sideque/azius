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
import { Ionicons } from "@expo/vector-icons";
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
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <Pressable
        onPress={() => {
          setSearch("");
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.field,
          { 
            backgroundColor: colors.surface, 
            borderColor: error ? colors.error : colors.border,
            transform: [{ scale: pressed ? 0.99 : 1 }]
          },
        ]}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 15, fontWeight: selected ? "500" : "400" }}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 400 }}>
            <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
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
                contentContainerStyle={{ paddingBottom: 10 }}
                keyExtractor={(item, index) =>
                  `${item.value || item.label}-${index}`
                }
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <Pressable
                      style={[
                        styles.option,
                        isSelected && {
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
                          color: isSelected ? colors.primary : colors.text,
                          fontWeight: isSelected ? "700" : "500",
                          fontSize: 15,
                        }}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                    </Pressable>
                  );
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, letterSpacing: 0.1 },
  field: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0.5,
  },
  searchInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    margin: 12,
    fontSize: 15,
  },
  overlay: { flex: 1, justifyContent: "center", alignItems: 'center', padding: 24 },
  list: { 
    borderRadius: 16, 
    maxHeight: 320, 
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
  },
  option: { 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
});

