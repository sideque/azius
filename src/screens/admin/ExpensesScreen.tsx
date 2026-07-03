import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  CustomButton,
  CustomInput,
  DatePickerField,
  Dropdown,
  EmptyState,
  LoadingComponent,
  useToast,
} from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../../services/database";
import { Expense } from "../../types";
import { formatCurrency, formatDate, toISOString } from "../../utils/formatters";

/* ───── category options ───── */
const EXPENSE_CATEGORIES = [
  { label: "🛢  Petrol", value: "Petrol" },
  { label: "🚗  Vehicle", value: "Vehicle" },
  { label: "🍔  Food", value: "Food" },
  { label: "🏠  Rent", value: "Rent" },
  { label: "💡  Utilities", value: "Utilities" },
  { label: "🛠  Maintenance", value: "Maintenance" },
  { label: "📦  Packaging", value: "Packaging" },
  { label: "🚚  Transport", value: "Transport" },
  { label: "📋  Others", value: "Others" },
];

const CATEGORY_ICONS: Record<string, string> = {
  Petrol: "🛢",
  Vehicle: "🚗",
  Food: "🍔",
  Rent: "🏠",
  Utilities: "💡",
  Maintenance: "🛠",
  Packaging: "📦",
  Transport: "🚚",
  Others: "📋",
};

export function ExpensesScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();

  /* ── form state ── */
  const [category, setCategory] = useState("Petrol");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  /* ── list state ── */
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* ── summary ── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);

  const todayTotal = expenses
    .filter((e) => e.expenseDate.slice(0, 10) === todayStr)
    .reduce((s, e) => s + e.amount, 0);

  const monthTotal = expenses
    .filter((e) => e.expenseDate.slice(0, 7) === monthStr)
    .reduce((s, e) => s + e.amount, 0);

  /* ── load ── */
  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses();
      setExpenses(data);
    } catch {
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, []),
  );

  /* ── add ── */
  const handleAdd = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    try {
      setSaving(true);
      const dateStr = toISOString(expenseDate);
      if (editingId) {
        await updateExpense(editingId, {
          category,
          amount: numAmount,
          notes: notes.trim(),
          expenseDate: dateStr,
        });
        showToast("Expense updated successfully", "success");
        setEditingId(null);
      } else {
        await createExpense(category, numAmount, notes.trim(), dateStr);
        showToast("Expense added successfully", "success");
      }
      setAmount("");
      setNotes("");
      setCategory("Petrol");
      setExpenseDate(new Date());
      await loadExpenses();
    } catch {
      showToast("Failed to add expense", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setNotes(exp.notes ?? "");
    try {
      setExpenseDate(new Date(exp.expenseDate));
    } catch {
      setExpenseDate(new Date());
    }
  };

  /* ── delete ── */
  const handleDelete = (expense: Expense) => {
    Alert.alert(
      "Delete Expense",
      `Delete ${formatCurrency(expense.amount)} (${expense.category}) expense?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(expense.id);
              await deleteExpense(expense.id);
              showToast("Expense deleted", "success");
              await loadExpenses();
            } catch {
              showToast("Failed to delete expense", "error");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  /* ── group by date ── */
  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = e.expenseDate.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const groupedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  /* ── render ── */
  if (loading) return <LoadingComponent />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* ── Summary Cards ── */}
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Today
          </Text>
          <Text style={[styles.summaryValue, { color: colors.error }]}>
            {formatCurrency(todayTotal)}
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            This Month
          </Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {formatCurrency(monthTotal)}
          </Text>
        </View>
      </View>

      {/* ── Add Expense Form ── */}
      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.formTitle, { color: colors.text }]}>
          Add Expense
        </Text>

        <Dropdown
          label="Category"
          value={category}
          options={EXPENSE_CATEGORIES}
          onChange={setCategory}
        />

        <CustomInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
        />

        <DatePickerField
          label="Date"
          value={expenseDate}
          onChange={setExpenseDate}
        />

        <CustomInput
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="E.g., Diesel for delivery van"
          multiline
        />

        <CustomButton
          title={
            saving
              ? editingId
                ? "Saving…"
                : "Adding…"
              : editingId
              ? "Save Changes"
              : "Add Expense"
          }
          onPress={handleAdd}
          disabled={saving}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* ── Expense History ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Expense History
      </Text>

      {groupedKeys.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No Expenses Yet"
          message="Add your first expense above"
        />
      ) : (
        groupedKeys.map((dateKey) => {
          const dayExpenses = grouped[dateKey];
          const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
          let displayDate: string;
          try {
            displayDate = formatDate(dateKey);
          } catch {
            displayDate = dateKey;
          }

          return (
            <View key={dateKey} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text
                  style={[styles.dayDate, { color: colors.text }]}
                >
                  {displayDate}
                </Text>
                <Text
                  style={[styles.dayTotal, { color: colors.error }]}
                >
                  {formatCurrency(dayTotal)}
                </Text>
              </View>

              {dayExpenses.map((exp) => (
                <View
                  key={exp.id}
                  style={[
                    styles.expenseRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseIcon}>
                      {CATEGORY_ICONS[exp.category] ?? "📋"}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.expenseCategory, { color: colors.text }]}
                      >
                        {exp.category}
                      </Text>
                      {exp.notes ? (
                        <Text
                          style={[
                            styles.expenseNotes,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {exp.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.expenseRight}>
                    <Text
                      style={[styles.expenseAmount, { color: colors.error }]}
                    >
                      {formatCurrency(exp.amount)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleEdit(exp)}
                      disabled={deletingId === exp.id}
                      style={[
                        styles.deleteBtn,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                        ✎
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(exp)}
                      disabled={deletingId === exp.id}
                      style={[
                        styles.deleteBtn,
                        { backgroundColor: colors.errorLight },
                      ]}
                    >
                      <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>
                        {deletingId === exp.id ? "…" : "✕"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ─────────────── styles ─────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },

  /* summary */
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 13, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: "700" },

  /* form */
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  /* history */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  dayGroup: { marginBottom: 16 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayDate: { fontSize: 14, fontWeight: "600" },
  dayTotal: { fontSize: 14, fontWeight: "700" },

  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  expenseLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  expenseIcon: { fontSize: 22 },
  expenseCategory: { fontSize: 15, fontWeight: "600" },
  expenseNotes: { fontSize: 12, marginTop: 2 },

  expenseRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  expenseAmount: { fontSize: 15, fontWeight: "700" },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
