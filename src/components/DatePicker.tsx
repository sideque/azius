import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
}

export function DatePickerField({ label, value, onChange, mode = 'date' }: Props) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <Pressable 
        onPress={() => setShow(true)} 
        style={({ pressed }) => [
          styles.field, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.99 : 1 }]
          }
        ]}
      >
        <Text style={{ color: colors.text, fontSize: 15 }}>{format(value, mode === 'time' ? 'hh:mm a' : 'dd MMM yyyy')}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode={mode === 'datetime' ? 'date' : mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShow(Platform.OS === 'ios');
            if (date) onChange(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, letterSpacing: 0.1 },
  field: { 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    shadowColor: 'rgba(0,0,0,0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0.5,
  },
});
