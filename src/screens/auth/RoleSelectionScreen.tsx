import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomButton } from '../../components';
import { useTheme } from '../../theme/ThemeContext';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Select Panel</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose how you want to use the app</Text>
      <CustomButton
        title="Admin Panel"
        onPress={() => navigation.replace('AdminApp')}
        style={styles.btn}
      />
      <CustomButton
        title="Sales Panel"
        onPress={() => navigation.replace('SalesApp')}
        variant="secondary"
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  btn: { marginBottom: 16 },
});
