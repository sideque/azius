import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { CustomButton, CustomInput, useToast } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, updateUser } from '../../store/slices/authSlice';
import { backupDatabase } from '../../store/slices/settingsSlice';
import { updateUserPassword, updateUserProfile } from '../../services/database';
import { useTheme } from '../../theme/ThemeContext';

export function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const { loading, backupData } = useAppSelector((s) => s.settings);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!user) return;
    await updateUserProfile(user.id, name, email);
    dispatch(updateUser({ name, email }));
    showToast('Profile updated');
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (currentPassword !== user.password) {
      showToast('Current password is incorrect', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    await updateUserPassword(user.id, newPassword);
    dispatch(updateUser({ password: newPassword }));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password changed');
  };

  const handleBackup = async () => {
    const result = await dispatch(backupDatabase());
    if (backupDatabase.fulfilled.match(result) && result.payload) {
      Alert.alert(
        'Backup Complete',
        `Data exported successfully (${result.payload.length} bytes). Backup JSON is stored in app memory.`,
      );
      showToast('Backup created successfully');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    const root = navigation.getParent()?.getParent();
    if (root) {
      root.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.section, { color: colors.text }]}>Profile</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomInput label="Name" value={name} onChangeText={setName} />
        <CustomInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <CustomButton title="Update Profile" onPress={handleUpdateProfile} />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Change Password</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomInput label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <CustomInput label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <CustomInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <CustomButton title="Change Password" onPress={handleChangePassword} variant="secondary" />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Preferences</Text>
      <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Data</Text>
      <CustomButton title="Backup Data" onPress={handleBackup} loading={loading} variant="outline" style={{ marginBottom: 12 }} />
      {backupData && <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 12 }}>Last backup: {backupData.length} bytes</Text>}

      <CustomButton title="Logout" onPress={handleLogout} variant="danger" style={{ marginTop: 24, marginBottom: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { 
    fontSize: 14, 
    fontWeight: '800', 
    marginTop: 20, 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 0.6,
  },
  card: { 
    borderRadius: 14, 
    padding: 16, 
    borderWidth: 1, 
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 14, 
    borderWidth: 1, 
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
});
