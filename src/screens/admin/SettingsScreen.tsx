import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { CustomButton, CustomInput, useToast } from '../../components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, updateUser } from '../../store/slices/authSlice';
import { getUserById, updateUserProfile } from '../../services/database';
import { auth } from '../../config/firebase';
import { useTheme } from '../../theme/ThemeContext';

export function SettingsScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const user = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Refresh from Firestore on mount so a session that logged in before a
  // profile update (or before name/email were saved at all) still shows the
  // latest saved values here and in the sidebar, instead of blank fields.
  useEffect(() => {
    if (!user) return;
    getUserById(user.id)
      .then((profile) => {
        if (!profile) return;
        setName(profile.name ?? '');
        setEmail(profile.email ?? '');
        dispatch(updateUser({ name: profile.name, email: profile.email }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateUserProfile(user.id, name, email);
      dispatch(updateUser({ name, email }));
      showToast('Profile updated — visible in your sidebar now');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (!currentPassword) {
      showToast('Enter your current password', 'error');
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

    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email) {
      showToast('Unable to verify your session. Please log in again.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed');
    } catch (error: any) {
      const message =
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential'
          ? 'Current password is incorrect'
          : error?.code === 'auth/too-many-requests'
            ? 'Too many attempts. Try again later.'
            : 'Failed to change password';
      showToast(message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    const root = navigation.getParent();
    if (root) {
      root.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
    }
  };

  const initial = (name || user?.username || 'A').charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.profileHeader,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {name || 'Add your name below'}
          </Text>
          <Text style={[styles.profileSub, { color: colors.textSecondary }]}>
            {email || user?.username}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
        <Text style={[styles.section, { color: colors.text }]}>Profile</Text>
      </View>
      <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>
        Your name is shown at the top of the sidebar menu.
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />
        <CustomInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="you@example.com"
          autoCapitalize="none"
        />
        <CustomButton
          title="Update Profile"
          onPress={handleUpdateProfile}
          loading={savingProfile}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
        <Text style={[styles.section, { color: colors.text }]}>Change Password</Text>
      </View>
      <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>
        Used to sign in to your account — at least 6 characters.
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CustomInput label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <CustomInput label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <CustomInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <CustomButton
          title="Change Password"
          onPress={handleChangePassword}
          variant="secondary"
          loading={changingPassword}
        />
      </View>

      <CustomButton title="Logout" onPress={handleLogout} variant="danger" style={{ marginTop: 24, marginBottom: 40 }} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  profileName: { fontSize: 17, fontWeight: '800' },
  profileSub: { fontSize: 13, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 4,
  },
  section: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCaption: {
    fontSize: 12,
    marginBottom: 10,
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
});
