import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function CustomInput({ label, error, style, onFocus, onBlur, ...props }: Props) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[
          styles.label, 
          { color: isFocused ? colors.primary : colors.textSecondary }
        ]}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.textMuted}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.input,
          { 
            backgroundColor: props.editable === false ? colors.background : colors.surface, 
            borderColor: error 
              ? colors.error 
              : isFocused 
                ? colors.primary 
                : colors.border, 
            color: props.editable === false ? colors.textMuted : colors.text,
            shadowColor: isFocused ? colors.primary : 'rgba(0,0,0,0.02)',
          },
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  input: { 
    borderWidth: 1.5, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 0.5,
  },
  error: { 
    fontSize: 12, 
    marginTop: 4,
    fontWeight: '500',
    marginLeft: 4,
  },
});

