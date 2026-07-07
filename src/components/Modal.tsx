import React from 'react';
import { KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CustomButton } from './CustomButton';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function ConfirmationDialog({
  visible, title, message, onConfirm, onCancel,
  confirmText = 'Confirm', cancelText = 'Cancel', destructive,
}: Props) {
  const { colors } = useTheme();
  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          {/* Icon indicator */}
          <View style={[styles.dialogIconWrap, { backgroundColor: destructive ? colors.errorLight : colors.primaryLight }]}>
            <Ionicons
              name={destructive ? 'warning-outline' : 'help-circle-outline'}
              size={28}
              color={destructive ? colors.error : colors.primary}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <CustomButton title={cancelText} onPress={onCancel} variant="outline" style={{ flex: 1, marginRight: 8 }} />
            <CustomButton title={confirmText} onPress={onConfirm} variant={destructive ? 'danger' : 'primary'} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </RNModal>
  );
}

interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ visible, title, onClose, children }: ModalProps) {
  const { colors } = useTheme();
  return (
    <RNModal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            {/* Handle indicator */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: colors.background },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', padding: 0 },
  // Dialog (centered)
  dialog: {
    margin: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, marginTop: 8, lineHeight: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', marginTop: 24, width: '100%' },
  // Bottom sheet modal
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

