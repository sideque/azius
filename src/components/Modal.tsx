import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
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
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={[styles.close, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 16, padding: 24 },
  modal: { borderRadius: 16, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  actions: { flexDirection: 'row', marginTop: 24 },
  close: { fontSize: 20, padding: 4 },
});
