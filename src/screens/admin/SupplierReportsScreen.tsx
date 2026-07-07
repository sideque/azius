// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   Alert,
//   FlatList,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { useFocusEffect, useNavigation } from "@react-navigation/native";
// import { DrawerNavigationProp } from "@react-navigation/drawer";
// import {
//   CustomButton,
//   Dropdown,
//   EmptyState,
//   LoadingSkeleton,
//   SummaryCard,
//   SupplierCard,
//   useToast,
// } from "../../components";
// import { useTheme } from "../../theme/ThemeContext";
// import {
//   deleteSupplierBill,
//   getSupplierBills,
//   getSupplierPayments,
//   getSuppliers,
// } from "../../services/database";
// import {
//   Supplier,
//   SupplierPaymentWithSupplier,
//   SupplierPurchaseBill,
// } from "../../types";
// import { formatCurrency, formatDate } from "../../utils/formatters";
// import { AdminDrawerParamList } from "../../navigation/types";

// const periodOptions = [
//   { label: "Daily", value: "daily" },
//   { label: "Monthly", value: "monthly" },
//   { label: "Yearly", value: "yearly" },
// ];

// export function SupplierReportsScreen() {
//   const { colors } = useTheme();
//   const navigation =
//     useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
//   const { showToast } = useToast();
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [selectedSupplierId, setSelectedSupplierId] = useState("");
//   const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">(
//     "monthly",
//   );
//   const [bills, setBills] = useState<SupplierPurchaseBill[]>([]);
//   const [payments, setPayments] = useState<SupplierPaymentWithSupplier[]>([]);
//   const [loading, setLoading] = useState(false);

//   const selectedSupplier = useMemo(
//     () => suppliers.find((supplier) => supplier.id === selectedSupplierId),
//     [selectedSupplierId, suppliers],
//   );

//   const loadSuppliers = async () => {
//     try {
//       const data = await getSuppliers();
//       setSuppliers(data);
//     } catch (error) {
//       showToast("Failed to load suppliers", "error");
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadSuppliers();
//     }, [showToast]),
//   );

//   const getPeriodStartDate = () => {
//     const now = new Date();
//     if (period === "daily") {
//       return new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         now.getDate(),
//       ).toISOString();
//     }
//     if (period === "monthly") {
//       return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
//     }
//     return new Date(now.getFullYear(), 0, 1).toISOString();
//   };

//   const loadReport = async () => {
//     if (!selectedSupplierId) {
//       setBills([]);
//       setPayments([]);
//       return;
//     }

//     setLoading(true);
//     try {
//       const [billsData, paymentsData] = await Promise.all([
//         getSupplierBills(selectedSupplierId),
//         getSupplierPayments(selectedSupplierId),
//       ]);

//       const startDate = getPeriodStartDate();
//       setBills(billsData.filter((bill) => bill.billDate >= startDate));
//       setPayments(
//         paymentsData.filter((payment) => payment.paymentDate >= startDate),
//       );
//     } catch (error) {
//       showToast("Failed to load supplier reports", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEditBill = (billId: string) => {
//     navigation.navigate("SupplierBilling", { billId } as never);
//   };

//   const confirmDeleteBill = (billId: string) => {
//     Alert.alert(
//       "Delete Supplier Bill",
//       "Are you sure you want to delete this bill? This will update the supplier outstanding balance.",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             setLoading(true);
//             try {
//               await deleteSupplierBill(billId);
//               showToast("Supplier bill deleted");
//               await loadReport();
//             } catch (error) {
//               showToast("Failed to delete supplier bill", "error");
//             } finally {
//               setLoading(false);
//             }
//           },
//         },
//       ],
//     );
//   };

//   useEffect(() => {
//     loadReport();
//   }, [selectedSupplierId, showToast, period]);

//   useFocusEffect(
//     useCallback(() => {
//       loadReport();
//     }, [selectedSupplierId, period]),
//   );

//   const totalBills = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
//   const totalPayments = payments.reduce(
//     (sum, payment) => sum + payment.amount,
//     0,
//   );
//  const balance = totalBills + (selectedSupplier?.outstandingBalance ?? 0) - totalPayments;

//   const ledgerEntries = useMemo(() => {
//     type EntryType = {
//       id: string;
//       date: string;
//       type: "bill" | "payment";
//       reference: string;
//       note: string;
//       amount: number;
//       balance: number;
//       paymentMethod?: string;
//     };

//     const combined: Omit<EntryType, "balance">[] = [
//       ...bills.map((bill) => ({
//         id: bill.id,
//         date: bill.billDate,
//         type: "bill" as const,
//         reference: bill.billNumber,
//         note: bill.notes || "",
//         amount: bill.totalAmount,
//       })),
//       ...payments.map((payment) => ({
//         id: payment.id,
//         date: payment.paymentDate,
//         type: "payment" as const,
//         reference: payment.receiptNumber,
//         note: payment.notes || "",
//         amount: payment.amount,
//         paymentMethod: payment.paymentMethod,
//       })),
//     ];

//     const sorted = combined.sort((a, b) => {
//       const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
//       if (dateDiff !== 0) return dateDiff;
//       return a.type === "payment" ? -1 : 1;
//     });

//     let runningBalance = 0;
//     const withBalance = sorted.map((entry) => {
//       runningBalance += entry.type === "bill" ? entry.amount : -entry.amount;
//       return { ...entry, balance: runningBalance };
//     });

//     return withBalance.reverse();
//   }, [bills, payments]);

//   const supplierOptions = [
//     { label: "Select Supplier", value: "" },
//     ...suppliers.map((supplier) => ({
//       label: supplier.supplierName,
//       value: supplier.id,
//     })),
//   ];

//   return (
//     <ScrollView
//       style={[styles.container, { backgroundColor: colors.background }]}
//       refreshControl={
//         <RefreshControl
//           refreshing={loading}
//           onRefresh={loadReport}
//           colors={[colors.primary]}
//         />
//       }
//     >
//       <Dropdown
//         label="Supplier"
//         options={supplierOptions}
//         value={selectedSupplierId}
//         onChange={setSelectedSupplierId}
//       />
//       <Dropdown
//         label="Period"
//         options={periodOptions}
//         value={period}
//         onChange={(value) => setPeriod(value as "daily" | "monthly" | "yearly")}
//       />

//       {!selectedSupplier ? (
//         <EmptyState
//           title="Select a supplier"
//           message="Choose a supplier to view purchase and payment history."
//           icon="🏭"
//         />
//       ) : (
//         <>
//           <View style={styles.summaryRow}>
//             <SummaryCard
//               title="Outstanding"
//               value={formatCurrency(
//                 selectedSupplier.outstandingBalance ?? balance,
//               )}
//               color={colors.errorLight}
//             />
//             <SummaryCard
//               title="Total Bills"
//               value={formatCurrency(totalBills)}
//               color={colors.primaryLight}
//             />
//           </View>
//           <View style={styles.summaryRow}>
//             <SummaryCard
//               title="Total Payments"
//               value={formatCurrency(totalPayments)}
//               color={colors.successLight}
//             />
//             <SummaryCard
//               title="Balance"
//               value={formatCurrency(balance)}
//               color={colors.warningLight}
//             />
//           </View>

//           <Text style={[styles.sectionTitle, { color: colors.text }]}>
//             Recent Bills
//           </Text>
//           {bills.length === 0 ? (
//             <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
//               No bills found for this supplier.
//             </Text>
//           ) : (
//             <FlatList
//               data={bills}
//               keyExtractor={(item) => item.id}
//               scrollEnabled={false}
//               renderItem={({ item }) => (
//                 <View
//                   style={[
//                     styles.card,
//                     {
//                       backgroundColor: colors.card,
//                       borderColor: colors.border,
//                     },
//                   ]}
//                 >
//                   <Text style={[styles.cardTitle, { color: colors.text }]}>
//                     {item.billNumber}
//                   </Text>
//                   <Text style={{ color: colors.textSecondary }}>
//                     {formatDate(item.billDate)}
//                   </Text>
//                   <Text style={{ color: colors.text, marginTop: 8 }}>
//                     {item.notes || "No notes"}
//                   </Text>
//                   {item.items?.map((line) => (
//                     <View key={line.id} style={styles.billLine}>
//                       <Text
//                         style={[styles.billLineText, { color: colors.text }]}
//                       >
//                         {line.productName} • {line.quantity} ×{" "}
//                         {formatCurrency(line.purchasePrice)}
//                       </Text>
//                       <Text
//                         style={[
//                           styles.billLineText,
//                           { color: colors.textSecondary },
//                         ]}
//                       >
//                         {formatCurrency(line.total)}
//                       </Text>
//                     </View>
//                   ))}
//                   <Text style={[styles.cardAmount, { color: colors.primary }]}>
//                     {formatCurrency(item.totalAmount)}
//                   </Text>
//                   <View style={styles.billActions}>
//                     <CustomButton
//                       title="Edit"
//                       onPress={() => handleEditBill(item.id)}
//                       variant="secondary"
//                       style={styles.billActionBtn}
//                     />
//                     <CustomButton
//                       title="Delete"
//                       onPress={() => confirmDeleteBill(item.id)}
//                       variant="danger"
//                       style={styles.billActionBtn}
//                     />
//                   </View>
//                 </View>
//               )}
//               ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//             />
//           )}

//           <Text
//             style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}
//           >
//             Recent Payments
//           </Text>
//           {payments.length === 0 ? (
//             <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
//               No payments found for this supplier.
//             </Text>
//           ) : (
//             <FlatList
//               data={payments}
//               keyExtractor={(item) => item.id}
//               scrollEnabled={false}
//               renderItem={({ item }) => (
//                 <View
//                   style={[
//                     styles.card,
//                     {
//                       backgroundColor: colors.card,
//                       borderColor: colors.border,
//                     },
//                   ]}
//                 >
//                   <Text style={[styles.cardTitle, { color: colors.text }]}>
//                     {item.receiptNumber}
//                   </Text>
//                   <Text style={{ color: colors.textSecondary }}>
//                     {formatDate(item.paymentDate)}
//                   </Text>
//                   <Text style={{ color: colors.text, marginTop: 8 }}>
//                     {item.paymentMethod}
//                   </Text>
//                   <Text style={[styles.cardAmount, { color: colors.success }]}>
//                     {formatCurrency(item.amount)}
//                   </Text>
//                 </View>
//               )}
//               ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
//             />
//           )}

//           <CustomButton
//             title="Make Supplier Payment"
//             onPress={() => navigation.navigate("SupplierPayments")}
//             style={{ marginTop: 24 }}
//           />
//         </>
//       )}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 16 },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     gap: 12,
//     marginTop: 16,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     marginTop: 20,
//     marginBottom: 12,
//   },
//   emptyText: { textAlign: "center", marginVertical: 20 },
//   card: { padding: 16, borderRadius: 12, borderWidth: 1 },
//   cardTitle: { fontSize: 15, fontWeight: "700" },
//   billLine: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 6,
//   },
//   billLineText: { fontSize: 13 },
//   ledgerHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//   },
//   ledgerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 6,
//   },
//   ledgerType: { fontSize: 13, fontWeight: "700" },
//   ledgerAmount: { fontSize: 14, fontWeight: "700" },
//   ledgerBalance: { marginTop: 10, fontSize: 14, fontWeight: "700" },
//   billActions: {
//     flexDirection: "row",
//     gap: 12,
//     marginTop: 14,
//   },
//   billActionBtn: { flex: 1, minWidth: 120 },
//   cardAmount: { marginTop: 8, fontSize: 16, fontWeight: "700" },
// });
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import {
  ConfirmationDialog,
  CustomButton,
  Dropdown,
  EmptyState,
  LoadingSkeleton,
  SummaryCard,
  SupplierCard,
  useToast,
} from "../../components";
import { useTheme } from "../../theme/ThemeContext";
import {
  deleteSupplierBill,
  deleteSupplierPayment,
  getSupplierBills,
  getSupplierPayments,
  getSuppliers,
} from "../../services/database";
import {
  Supplier,
  SupplierPaymentWithSupplier,
  SupplierPurchaseBill,
} from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { AdminDrawerParamList } from "../../navigation/types";

const periodOptions = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "All Time", value: "all" },
];

type LedgerEntry = {
  id: string;
  date: string;
  type: "bill" | "payment";
  reference: string;
  note: string;
  amount: number;
  balance: number;
  paymentMethod?: string;
  raw: SupplierPurchaseBill | SupplierPaymentWithSupplier;
};

export function SupplierReportsScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly" | "all">(
    "monthly",
  );
  const [bills, setBills] = useState<SupplierPurchaseBill[]>([]);
  const [payments, setPayments] = useState<SupplierPaymentWithSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "bill" | "payment"; id: string } | null
  >(null);

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier.id === selectedSupplierId),
    [selectedSupplierId, suppliers],
  );

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      showToast("Failed to load suppliers", "error");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, [showToast]),
  );

  const getPeriodStartDate = () => {
    if (period === "all") {
      return "";
    }
    const now = new Date();
    if (period === "daily") {
      return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
    }
    if (period === "monthly") {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    return new Date(now.getFullYear(), 0, 1).toISOString();
  };

  const loadReport = async () => {
    if (!selectedSupplierId) {
      setBills([]);
      setPayments([]);
      return;
    }

    setLoading(true);
    try {
      const [billsData, paymentsData] = await Promise.all([
        getSupplierBills(selectedSupplierId),
        getSupplierPayments(selectedSupplierId),
      ]);

      const startDate = getPeriodStartDate();
      setBills(billsData.filter((bill) => bill.billDate >= startDate));
      setPayments(
        paymentsData.filter((payment) => payment.paymentDate >= startDate),
      );
    } catch (error) {
      showToast("Failed to load supplier reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBill = (billId: string) => {
    navigation.navigate("SupplierBilling", { billId } as never);
  };

  const handleEditPayment = (paymentId: string) => {
    navigation.navigate("SupplierPayments", { paymentId } as never);
  };

  const confirmDeleteBill = (billId: string) => {
    setPendingDelete({ type: "bill", id: billId });
  };

  const confirmDeletePayment = (paymentId: string) => {
    setPendingDelete({ type: "payment", id: paymentId });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setPendingDelete(null);
    setLoading(true);
    try {
      if (type === "bill") {
        await deleteSupplierBill(id);
        showToast("Purchase bill deleted");
      } else {
        await deleteSupplierPayment(id);
        showToast("Supplier payment deleted");
      }
      await loadReport();
    } catch (error) {
      showToast(
        type === "bill"
          ? "Failed to delete purchase bill"
          : "Failed to delete supplier payment",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedSupplierId, showToast, period]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [selectedSupplierId, period]),
  );

  const totalBills = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const openingBalance = selectedSupplier?.openingBalance ?? 0;
  const balance = openingBalance + totalBills - totalPayments;

  // Chronological ledger (oldest -> newest) used to compute a running balance,
  // then reversed so the newest entry appears first, like a real passbook.
  const ledgerEntries = useMemo<LedgerEntry[]>(() => {
    const combined: Omit<LedgerEntry, "balance">[] = [
      ...bills.map((bill) => ({
        id: bill.id,
        date: bill.billDate,
        type: "bill" as const,
        reference: bill.billNumber,
        note: bill.notes || "",
        amount: bill.totalAmount,
        raw: bill,
      })),
      ...payments.map((payment) => ({
        id: payment.id,
        date: payment.paymentDate,
        type: "payment" as const,
        reference: payment.receiptNumber,
        note: payment.notes || "",
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        raw: payment,
      })),
    ];

    const sorted = combined.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.type === "payment" ? -1 : 1;
    });

    let runningBalance = 0;
    const withBalance = sorted.map((entry) => {
      runningBalance += entry.type === "bill" ? entry.amount : -entry.amount;
      return { ...entry, balance: runningBalance };
    });

    return withBalance.reverse();
  }, [bills, payments]);

  const supplierOptions = [
    { label: "Select Supplier", value: "" },
    ...suppliers.map((supplier) => ({
      label: supplier.supplierName,
      value: supplier.id,
    })),
  ];
  const periodLabel =
    periodOptions.find((option) => option.value === period)?.label ?? "";

  const renderLedgerRow = ({ item }: { item: LedgerEntry }) => {
    const isBill = item.type === "bill";
    const accent = isBill ? colors.error : colors.success;
    const isExpanded = expandedId === item.id;
    const billItems = isBill
      ? (item.raw as SupplierPurchaseBill).items
      : undefined;

    return (
      <View
        style={[
          styles.ledgerCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.ledgerAccentBar, { backgroundColor: accent }]} />
        <View style={styles.ledgerCardBody}>
          <View style={styles.ledgerTopRow}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isBill
                    ? colors.errorLight
                    : colors.successLight,
                },
              ]}
            >
              <Ionicons name={isBill ? "arrow-down" : "arrow-up"} size={14} color={accent} />
            </View>
            <View style={styles.ledgerHeaderText}>
              <Text style={[styles.ledgerReference, { color: colors.text }]}>
                {item.reference}
              </Text>
              <Text
                style={[styles.ledgerDate, { color: colors.textSecondary }]}
              >
                {formatDate(item.date)}
                {item.type === "payment" && item.paymentMethod
                  ? ` • ${item.paymentMethod}`
                  : ""}
              </Text>
            </View>
            <View style={styles.ledgerAmountBlock}>
              <View
                style={[
                  styles.amountTag,
                  {
                    backgroundColor: isBill
                      ? colors.errorLight
                      : colors.successLight,
                  },
                ]}
              >
                <Text style={[styles.amountTagText, { color: accent }]}>
                  {isBill ? "+" : "−"}
                  {formatCurrency(item.amount)}
                </Text>
              </View>
              <Text style={[styles.ledgerBalanceBig, { color: colors.text }]}>
                {formatCurrency(item.balance)}
              </Text>
              <Text
                style={[
                  styles.ledgerBalanceCaption,
                  { color: colors.textSecondary },
                ]}
              >
                Balance
              </Text>
            </View>
          </View>

          {!!item.note && (
            <Text
              style={[styles.ledgerNote, { color: colors.textSecondary }]}
              numberOfLines={isExpanded ? undefined : 1}
            >
              {item.note}
            </Text>
          )}

          {/* {isBill && billItems && billItems.length > 0 && (
            <>
              {isExpanded && (
                <View
                  style={[styles.lineItemBox, { borderColor: colors.border }]}
                >
                  {billItems.map((line) => (
                    <View key={line.id} style={styles.billLine}>
                      <Text
                        style={[styles.billLineText, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {line.productName} · {line.quantity} ×{" "}
                        {formatCurrency(line.purchasePrice)}
                      </Text>
                      <Text
                        style={[
                          styles.billLineText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatCurrency(line.total)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.ledgerActionsRow}>
                <Text
                  style={[styles.expandToggle, { color: colors.primary }]}
                  onPress={() =>
                    setExpandedId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                >
                  {isExpanded
                    ? "Hide items"
                    : `${billItems.length} item${billItems.length > 1 ? "s" : ""} · View`}
                </Text>
                <View style={styles.ledgerActionsButtons}>
                  <CustomButton
                    title="Edit"
                    onPress={() => handleEditBill(item.id)}
                    variant="secondary"
                    style={styles.ledgerActionBtn}
                  />
                  <CustomButton
                    title="Delete"
                    onPress={() => confirmDeleteBill(item.id)}
                    variant="danger"
                    style={styles.ledgerActionBtn}
                  />
                </View>
              </View>
            </>
          )} */}
          {isBill ? (
            billItems &&
            billItems.length > 0 && (
              <>
                {isExpanded && (
                  <View
                    style={[styles.lineItemBox, { borderColor: colors.border }]}
                  >
                    {billItems.map((line) => (
                      <View key={line.id} style={styles.billLine}>
                        <Text
                          style={[styles.billLineText, { color: colors.text }]}
                        >
                          {line.productName} · {line.quantity} ×{" "}
                          {formatCurrency(line.purchasePrice)}
                        </Text>
                        <Text
                          style={[
                            styles.billLineText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatCurrency(line.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.ledgerActionsRow}>
                  <Text
                    style={[styles.expandToggle, { color: colors.primary }]}
                    onPress={() =>
                      setExpandedId((id) => (id === item.id ? null : item.id))
                    }
                  >
                    {isExpanded
                      ? "Hide items"
                      : `${billItems.length} item${billItems.length > 1 ? "s" : ""} · View`}
                  </Text>

                  <View style={styles.ledgerActionsButtons}>
                    <CustomButton
                      title="Edit"
                      onPress={() => handleEditBill(item.id)}
                      variant="secondary"
                      style={styles.ledgerActionBtn}
                    />
                    <CustomButton
                      title="Delete"
                      onPress={() => confirmDeleteBill(item.id)}
                      variant="danger"
                      style={styles.ledgerActionBtn}
                    />
                  </View>
                </View>
              </>
            )
          ) : (
            <View style={styles.ledgerActionsRow}>
              <View />
              <View style={styles.ledgerActionsButtons}>
                <CustomButton
                  title="Edit"
                  onPress={() => handleEditPayment(item.id)}
                  variant="secondary"
                  style={styles.ledgerActionBtn}
                />
                <CustomButton
                  title="Delete"
                  onPress={() => confirmDeletePayment(item.id)}
                  variant="danger"
                  style={styles.ledgerActionBtn}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.topSection}>
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Supplier"
              options={supplierOptions}
              value={selectedSupplierId}
              onChange={setSelectedSupplierId}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Dropdown
              label="Period"
              options={periodOptions}
              value={period}
              onChange={(value) =>
                setPeriod(value as "daily" | "monthly" | "yearly" | "all")
              }
            />
          </View>
        </View>

        {!selectedSupplier ? (
          <EmptyState
            title="Select a supplier"
            message="Choose a supplier to view purchase and payment history."
            icon="business-outline"
          />
        ) : (
          <>
            {/* Statement header */}
            <View
              style={[
                styles.statementHeader,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.statementHeaderTop}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {selectedSupplier.supplierName?.charAt(0)?.toUpperCase() ?? "S"}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.statementName, { color: colors.text }]}>
                    {selectedSupplier.supplierName}
                  </Text>
                  <Text
                    style={[styles.statementSub, { color: colors.textSecondary }]}
                  >
                    {periodLabel} Statement
                  </Text>
                </View>
              </View>

              <View style={styles.statementDivider} />

              {/* Opening Balance — the balance carried forward before this period */}
              <View style={styles.balanceRow}>
                <View style={styles.balanceLabelBlock}>
                  <Text style={[styles.balanceLabel, { color: colors.text }]}>
                    Opening Balance
                  </Text>
                  <Text
                    style={[
                      styles.balanceCaption,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Carried forward from before this period
                  </Text>
                </View>
                <Text
                  style={[
                    styles.balanceValueSmall,
                    {
                      color: openingBalance > 0 ? colors.error : colors.success,
                    },
                  ]}
                >
                  {formatCurrency(openingBalance)}
                </Text>
              </View>

              {/* Shows how this period's activity moves opening -> net balance */}
              <View style={styles.balanceMathRow}>
                <Text
                  style={[styles.balanceMathText, { color: colors.textSecondary }]}
                >
                  + {formatCurrency(totalBills)} bills − {formatCurrency(totalPayments)} paid
                </Text>
              </View>

              {/* Net Balance — what is currently owed after this period's bills & payments */}
              <View
                style={[
                  styles.balanceRow,
                  styles.netBalanceRow,
                  {
                    backgroundColor: balance > 0 ? colors.errorLight : colors.successLight,
                  },
                ]}
              >
                <View style={styles.balanceLabelBlock}>
                  <Text style={[styles.balanceLabelNet, { color: colors.text }]}>
                    Net Balance
                  </Text>
                  <Text
                    style={[
                      styles.balanceCaption,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {balance > 0
                      ? "You owe this supplier"
                      : balance < 0
                        ? "Supplier owes you (credit)"
                        : "Settled — nothing due"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statementBalanceValue,
                    { color: balance > 0 ? colors.error : colors.success },
                  ]}
                >
                  {formatCurrency(balance)}
                </Text>
              </View>
            </View>

            {/* Summary stat grid */}
            <View style={styles.statGrid}>
              <View
                style={[
                  styles.statCell,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  TOTAL BILLS
                </Text>
                <Text style={[styles.statValue, { color: colors.error }]}>
                  {formatCurrency(totalBills)}
                </Text>
                <Text style={[styles.statCount, { color: colors.textSecondary }]}>
                  {bills.length} bill{bills.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <View
                style={[
                  styles.statCell,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  TOTAL PAID
                </Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {formatCurrency(totalPayments)}
                </Text>
                <Text style={[styles.statCount, { color: colors.textSecondary }]}>
                  {payments.length} payment{payments.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Ledger section header — stays fixed; only the entries below scroll */}
            <View style={styles.ledgerSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Ledger
              </Text>
              <Text
                style={[
                  styles.ledgerSectionCount,
                  { color: colors.textSecondary },
                ]}
              >
                {ledgerEntries.length} entr
                {ledgerEntries.length !== 1 ? "ies" : "y"}
              </Text>
            </View>
          </>
        )}
      </View>

      {selectedSupplier && (
        <View style={styles.ledgerListWrapper}>
          {ledgerEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No activity for this period.
            </Text>
          ) : (
            <FlatList
              data={ledgerEntries}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              renderItem={renderLedgerRow}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={styles.ledgerListContent}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={loadReport}
                  colors={[colors.primary]}
                />
              }
            />
          )}
        </View>
      )}

      {selectedSupplier && (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <CustomButton
            title="Make Supplier Payment"
            onPress={() => navigation.navigate("SupplierPayments")}
          />
        </View>
      )}

      <ConfirmationDialog
        visible={!!pendingDelete}
        title={pendingDelete?.type === "bill" ? "Delete Purchase Bill" : "Delete Supplier Payment"}
        message={`Are you sure you want to delete this ${pendingDelete?.type === "bill" ? "bill" : "payment"}? This will update the supplier outstanding balance.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topSection: { paddingHorizontal: 16, paddingTop: 10 },
  filterRow: { flexDirection: "row", gap: 10 },
  ledgerListWrapper: { flex: 1 },
  ledgerListContent: { paddingHorizontal: 16, paddingBottom: 16 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },

  // Statement header
  statementHeader: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statementHeaderTop: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 10, // soft rounded corners instead of circle
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "800" },
  statementName: { fontSize: 15, fontWeight: "700" },
  statementSub: { fontSize: 11, marginTop: 1 },
  statementDivider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.15)",
    marginVertical: 8,
  },
  statementBalanceValue: { fontSize: 19, fontWeight: "800" },

  // Opening -> Net balance breakdown
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabelBlock: { flex: 1, marginRight: 12 },
  balanceLabel: { fontSize: 13, fontWeight: "700" },
  balanceLabelNet: { fontSize: 14, fontWeight: "800" },
  balanceCaption: { fontSize: 11, marginTop: 2 },
  balanceValueSmall: { fontSize: 15, fontWeight: "700" },
  balanceMathRow: { alignItems: "center", marginVertical: 6 },
  balanceMathText: { fontSize: 11, fontWeight: "600" },
  netBalanceRow: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 2,
  },

  // Stat grid
  statGrid: { flexDirection: "row", gap: 10, marginTop: 8 },
  statCell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  statCount: { fontSize: 11, marginTop: 2 },

  // Ledger section
  ledgerSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  ledgerSectionCount: { fontSize: 12 },
  emptyText: { textAlign: "center", marginVertical: 20 },

  // Ledger card row
  ledgerCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  ledgerAccentBar: { width: 4 },
  ledgerCardBody: { flex: 1, padding: 14 },
  ledgerTopRow: { flexDirection: "row", alignItems: "center" },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ledgerHeaderText: { flex: 1, marginLeft: 10 },
  ledgerReference: { fontSize: 14, fontWeight: "700" },
  ledgerDate: { fontSize: 11, marginTop: 2 },
  ledgerAmountBlock: { alignItems: "flex-end" },
  amountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  amountTagText: { fontSize: 10, fontWeight: "700" },
  ledgerBalanceBig: { fontSize: 21, fontWeight: "800" },
  ledgerBalanceCaption: {
    fontSize: 9,
    marginTop: 1,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  ledgerNote: { fontSize: 12, marginTop: 8, fontStyle: "italic" },

  // Bill line items
  lineItemBox: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  billLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  billLineText: { fontSize: 12, flexShrink: 1 },

  // Actions
  ledgerActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  expandToggle: { fontSize: 12, fontWeight: "700" },
  ledgerActionsButtons: { flexDirection: "row", gap: 8 },
  ledgerActionBtn: { minWidth: 72, paddingVertical: 4 },
});
