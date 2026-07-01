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
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import {
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
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">(
    "monthly",
  );
  const [bills, setBills] = useState<SupplierPurchaseBill[]>([]);
  const [payments, setPayments] = useState<SupplierPaymentWithSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const confirmDeleteBill = (billId: string) => {
    Alert.alert(
      "Delete Supplier Bill",
      "Are you sure you want to delete this bill? This will update the supplier outstanding balance.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteSupplierBill(billId);
              showToast("Supplier bill deleted");
              await loadReport();
            } catch (error) {
              showToast("Failed to delete supplier bill", "error");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
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
  const balance =
    totalBills + (selectedSupplier?.outstandingBalance ?? 0) - totalPayments;

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
                { backgroundColor: isBill ? colors.errorLight : colors.successLight },
              ]}
            >
              <Text style={[styles.typeBadgeIcon, { color: accent }]}>
                {isBill ? "↓" : "↑"}
              </Text>
            </View>
            <View style={styles.ledgerHeaderText}>
              <Text style={[styles.ledgerReference, { color: colors.text }]}>
                {item.reference}
              </Text>
              <Text style={[styles.ledgerDate, { color: colors.textSecondary }]}>
                {formatDate(item.date)}
                {item.type === "payment" && item.paymentMethod
                  ? ` • ${item.paymentMethod}`
                  : ""}
              </Text>
            </View>
            <View style={styles.ledgerAmountBlock}>
              <Text style={[styles.ledgerAmount, { color: accent }]}>
                {isBill ? "+" : "−"}
                {formatCurrency(item.amount)}
              </Text>
              <Text
                style={[styles.ledgerRunningBalance, { color: colors.textSecondary }]}
              >
                Bal {formatCurrency(item.balance)}
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

          {isBill && billItems && billItems.length > 0 && (
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
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadReport}
          colors={[colors.primary]}
        />
      }
    >
      <Dropdown
        label="Supplier"
        options={supplierOptions}
        value={selectedSupplierId}
        onChange={setSelectedSupplierId}
      />
      <Dropdown
        label="Period"
        options={periodOptions}
        value={period}
        onChange={(value) => setPeriod(value as "daily" | "monthly" | "yearly")}
      />

      {!selectedSupplier ? (
        <EmptyState
          title="Select a supplier"
          message="Choose a supplier to view purchase and payment history."
          icon="🏭"
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
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
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
                  {periodLabel} statement
                </Text>
              </View>
            </View>

            <View style={styles.statementDivider} />

            <View style={styles.statementBalanceRow}>
              <Text
                style={[styles.statementBalanceLabel, { color: colors.textSecondary }]}
              >
                Net Outstanding
              </Text>
              <Text
                style={[
                  styles.statementBalanceValue,
                  { color: balance > 0 ? colors.error : colors.success },
                ]}
              >
                {formatCurrency(selectedSupplier.outstandingBalance ?? balance)}
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

          {/* Unified ledger */}
          <View style={styles.ledgerSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Ledger
            </Text>
            <Text style={[styles.ledgerSectionCount, { color: colors.textSecondary }]}>
              {ledgerEntries.length} entr{ledgerEntries.length !== 1 ? "ies" : "y"}
            </Text>
          </View>

          {ledgerEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No activity for this period.
            </Text>
          ) : (
            <FlatList
              data={ledgerEntries}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              scrollEnabled={false}
              renderItem={renderLedgerRow}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}

          <CustomButton
            title="Make Supplier Payment"
            onPress={() => navigation.navigate("SupplierPayments")}
            style={{ marginTop: 24, marginBottom: 8 }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  // Statement header
  statementHeader: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  statementHeaderTop: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  statementName: { fontSize: 17, fontWeight: "700" },
  statementSub: { fontSize: 12, marginTop: 2 },
  statementDivider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.15)",
    marginVertical: 14,
  },
  statementBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statementBalanceLabel: { fontSize: 13, fontWeight: "600" },
  statementBalanceValue: { fontSize: 22, fontWeight: "800" },

  // Stat grid
  statGrid: { flexDirection: "row", gap: 12, marginTop: 14 },
  statCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  statValue: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  statCount: { fontSize: 11, marginTop: 4 },

  // Ledger section
  ledgerSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  ledgerSectionCount: { fontSize: 12 },
  emptyText: { textAlign: "center", marginVertical: 20 },

  // Ledger card row
  ledgerCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  ledgerAccentBar: { width: 4 },
  ledgerCardBody: { flex: 1, padding: 14 },
  ledgerTopRow: { flexDirection: "row", alignItems: "center" },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeIcon: { fontSize: 16, fontWeight: "800" },
  ledgerHeaderText: { flex: 1, marginLeft: 10 },
  ledgerReference: { fontSize: 14, fontWeight: "700" },
  ledgerDate: { fontSize: 11, marginTop: 2 },
  ledgerAmountBlock: { alignItems: "flex-end" },
  ledgerAmount: { fontSize: 15, fontWeight: "800" },
  ledgerRunningBalance: { fontSize: 10, marginTop: 3 },
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