import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { ConfirmationDialog, EmptyState, LoadingComponent, useToast } from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import { deleteExpense, getExpenses } from "../../services/database";
import { Expense } from "../../types";
import { formatCurrency, formatDate, getDateRange } from "../../utils/formatters";
import { AdminDrawerParamList } from "../../navigation/types";

type DateFilterPeriod = "all" | "daily" | "monthly" | "yearly";

const DATE_FILTER_OPTIONS: { label: string; value: DateFilterPeriod }[] = [
  { label: "All", value: "all" },
  { label: "Day", value: "daily" },
  { label: "Month", value: "monthly" },
  { label: "Year", value: "yearly" },
];

type IoniconsName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ICONS: Record<string, IoniconsName> = {
  Petrol: "water-outline",
  Vehicle: "car-outline",
  Food: "fast-food-outline",
  Rent: "home-outline",
  Utilities: "flash-outline",
  Maintenance: "build-outline",
  Packaging: "cube-outline",
  Transport: "car-sport-outline",
  Others: "ellipsis-horizontal-outline",
};

export function ExpensesScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();

  /* ── list state ── */
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  /* ── date filter ── */
  const [dateFilter, setDateFilter] = useState<DateFilterPeriod>("all");
  const filteredExpenses =
    dateFilter === "all"
      ? expenses
      : (() => {
          const { startDate, endDate } = getDateRange(dateFilter);
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime();
          return expenses.filter((e) => {
            const t = new Date(e.expenseDate).getTime();
            return t >= start && t <= end;
          });
        })();

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

  const handleEdit = (exp: Expense) => {
    navigation.navigate("ExpenseForm", { expense: exp });
  };

  /* ── delete ── */
  const handleDelete = (expense: Expense) => {
    // mark as pending so UI shows loading state while confirmation is active
    setDeletingId(expense.id);
    setPendingDelete(expense);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    setDeletingId(null);
  };

  const confirmDelete = async () => {
    const expense = pendingDelete;
    if (!expense) return;
    setPendingDelete(null);
    try {
      // optimistic remove from UI
      setExpenses((prev) => prev.filter((p) => p.id !== expense.id));
      await deleteExpense(expense.id);
      showToast("Expense deleted", "success");
      // ensure sync with server
      await loadExpenses();
    } catch {
      console.error("Failed to delete expense", expense.id);
      showToast("Failed to delete expense", "error");
      // reload to restore removed item
      await loadExpenses();
    } finally {
      setDeletingId(null);
    }
  };

  /* ── group by date ── */
  const grouped = filteredExpenses.reduce<Record<string, Expense[]>>((acc, e) => {
    const key = e.expenseDate.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const groupedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  /* ── render ── */
  if (loading) return <LoadingComponent />;

  return (
    <>
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

      {/* ── Add Expense ── */}
      <Pressable
        style={[styles.addBtn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("ExpenseForm", { expense: undefined })}
      >
        <Text style={styles.addText}>+ Add Expense</Text>
      </Pressable>

      {/* ── Expense History ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Expense History
      </Text>

      <View style={styles.filterRow}>
        {DATE_FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setDateFilter(opt.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  dateFilter === opt.value ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: dateFilter === opt.value ? "#fff" : colors.text,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {groupedKeys.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title={dateFilter === "all" ? "No Expenses Yet" : "No Matching Expenses"}
          message={
            dateFilter === "all"
              ? "Add your first expense above"
              : "No expenses found for this period"
          }
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
                    <View style={[styles.expenseIconWrap, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons
                        name={CATEGORY_ICONS[exp.category] ?? "ellipsis-horizontal-outline"}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
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
                      <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(exp)}
                      disabled={deletingId === exp.id}
                      style={[
                        styles.deleteBtn,
                        { backgroundColor: colors.errorLight },
                      ]}
                    >
                      {deletingId === exp.id ? (
                        <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>…</Text>
                      ) : (
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                      )}
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

    <ConfirmationDialog
      visible={!!pendingDelete}
      title="Delete Expense"
      message={
        pendingDelete
          ? `Delete ${formatCurrency(pendingDelete.amount)} (${pendingDelete.category}) expense?`
          : ""
      }
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
      destructive
    />
    </>
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

  /* add button */
  addBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },
  addText: { color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },

  /* history */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
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
  expenseIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
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
