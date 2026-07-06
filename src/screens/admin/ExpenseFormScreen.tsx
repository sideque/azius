import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  useToast,
} from "../../components";
import { createExpense, updateExpense } from "../../services/database";
import { useTheme } from "../../theme/ThemeContext";
import { AdminDrawerParamList } from "../../navigation/types";
import { toISOString } from "../../utils/formatters";

const EXPENSE_CATEGORIES = [
  { label: "Petrol", value: "Petrol" },
  { label: "Vehicle", value: "Vehicle" },
  { label: "Food", value: "Food" },
  { label: "Rent", value: "Rent" },
  { label: "Utilities", value: "Utilities" },
  { label: "Maintenance", value: "Maintenance" },
  { label: "Packaging", value: "Packaging" },
  { label: "Transport", value: "Transport" },
  { label: "Others", value: "Others" },
];

export function ExpenseFormScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<AdminDrawerParamList, "ExpenseForm">>();
  const expense = route.params?.expense;
  const isEdit = !!expense;

  const [category, setCategory] = useState("Petrol");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  // Drawer screens stay mounted, so this only fires the useState
  // initializers once. Re-sync from route params on every focus so
  // switching between "add" and "edit" (or between two different
  // expenses) doesn't leave stale values in the form.
  useFocusEffect(
    useCallback(() => {
      if (expense) {
        setCategory(expense.category);
        setAmount(String(expense.amount));
        setNotes(expense.notes ?? "");
        setExpenseDate(new Date(expense.expenseDate));
      } else {
        setCategory("Petrol");
        setAmount("");
        setNotes("");
        setExpenseDate(new Date());
      }
    }, [expense]),
  );

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    try {
      setSaving(true);
      const dateStr = toISOString(expenseDate);
      if (isEdit && expense) {
        await updateExpense(expense.id, {
          category,
          amount: numAmount,
          notes: notes.trim(),
          expenseDate: dateStr,
        });
        showToast("Expense updated successfully", "success");
      } else {
        await createExpense(category, numAmount, notes.trim(), dateStr);
        showToast("Expense added successfully", "success");
      }
      navigation.navigate("Expenses" as never);
    } catch {
      showToast("Failed to save expense", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Dropdown
          label="Category"
          value={category}
          options={EXPENSE_CATEGORIES}
          onChange={setCategory}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <CustomInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.col}>
            <DatePickerField
              label="Date"
              value={expenseDate}
              onChange={setExpenseDate}
            />
          </View>
        </View>

        <CustomInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="E.g., Diesel for delivery van"
          multiline
          numberOfLines={3}
        />

        <CustomButton
          title={
            saving
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save Changes"
                : "Add Expense"
          }
          onPress={handleSave}
          disabled={saving}
        />
        <CustomButton
          title="Back to Expenses"
          onPress={() => navigation.navigate("Expenses" as never)}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
});
