import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function CustomButton({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const { colors } = useTheme();
  const isOutline = variant === 'outline';
  
  // Custom button background color mapping
  const bg = variant === 'danger' 
    ? colors.error 
    : variant === 'secondary' 
      ? colors.secondary 
      : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isOutline 
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary } 
          : { backgroundColor: bg },
        (disabled || loading) && { opacity: 0.5 },
        pressed && styles.pressed,
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : '#fff'} />
      ) : (
        <Text style={[styles.text, { color: isOutline ? colors.primary : '#fff' }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  text: { 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.9,
  },
});

