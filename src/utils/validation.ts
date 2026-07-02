import { Supplier } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateRequired(
  value: string,
  fieldName: string,
): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

export function validateNumber(
  value: string,
  fieldName: string,
  min = 0,
): string | null {
  const num = parseFloat(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (num < min) return `${fieldName} must be at least ${min}`;
  return null;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return "Phone number is required";
  if (!/^[0-9+\-\s()]{7,15}$/.test(value.trim())) return "Invalid phone number";
  return null;
}

export function validateLogin(
  username: string,
  password: string,
): ValidationResult {
  const errors: Record<string, string> = {};
  const u = validateRequired(username, "Username");
  const p = validateRequired(password, "Password");
  if (u) errors.username = u;
  if (p) errors.password = p;
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateProduct(
  data: Record<string, string>,
  requireSupplier = false,
): ValidationResult {
  const errors: Record<string, string> = {};
  const fields: [string, string][] = [
    ["productName", "Product name"],
    ["productCode", "Product code"],
    ["unit", "Unit"],
  ];
  fields.forEach(([key, label]) => {
    const err = validateRequired(data[key] ?? "", label);
    if (err) errors[key] = err;
  });
  ["purchasePrice", "sellingPrice", "stockQuantity"].forEach((key) => {
    const label = key.replace(/([A-Z])/g, " $1").trim();
    const err = validateNumber(
      data[key] ?? "",
      label.charAt(0).toUpperCase() + label.slice(1),
    );
    if (err) errors[key] = err;
  });
  if (requireSupplier && !data.supplierId) {
    errors.supplierId = "Supplier ledger is required";
  }
  if (!errors.sellingPrice && !errors.purchasePrice) {
    const sell = parseFloat(data.sellingPrice);
    const purchase = parseFloat(data.purchasePrice);
    if (sell < purchase)
      errors.sellingPrice = "Selling price should be >= purchase price";
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateShop(data: Record<string, string>): ValidationResult {
  const errors: Record<string, string> = {};
  ["shopName", "ownerName", "address"].forEach((key) => {
    const label = key.replace(/([A-Z])/g, " $1").trim();
    const err = validateRequired(
      data[key] ?? "",
      label.charAt(0).toUpperCase() + label.slice(1),
    );
    if (err) errors[key] = err;
  });
  const phoneErr = validatePhone(data.phoneNumber ?? "");
  if (phoneErr) errors.phoneNumber = phoneErr;
  const creditErr = validateNumber(data.creditLimit ?? "0", "Credit limit");
  if (creditErr) errors.creditLimit = creditErr;
  return { isValid: Object.keys(errors).length === 0, errors };
}

// export function validateSupplier(
//   data: Record<string, string>,
// ): ValidationResult {
//   const errors: Record<string, string> = {};
//   console.log(items, "suiiiiiiiiiiiiiiiiiiiiiii");
//   const supplierNameError = validateRequired(
//     data.supplierName ?? "",
//     "Supplier name",
//   );
//   if (supplierNameError) errors.supplierName = supplierNameError;
//   const phoneErr = validatePhone(data.phoneNumber ?? "");
//   if (phoneErr) errors.phoneNumber = phoneErr;
//   const openingBalanceErr = validateNumber(
//     data.openingBalance ?? "0",
//     "Opening balance",
//     0,
//   );
//   if (openingBalanceErr) errors.openingBalance = openingBalanceErr;
//   return { isValid: Object.keys(errors).length === 0, errors };
// }

export function validateSupplier(
  data: Record<string, string>,
  suppliers: Supplier[],
  currentSupplierId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  const supplierName = data.supplierName.trim();

  const supplierNameError = validateRequired(
    supplierName,
    "Supplier name"
  );

  if (supplierNameError) {
    errors.supplierName = supplierNameError;
  } else {
    const duplicate = suppliers.find(
      (supplier) =>
        supplier.supplierName.trim().toLowerCase() ===
          supplierName.toLowerCase() &&
        supplier.id !== currentSupplierId
    );

    if (duplicate) {
      errors.supplierName = "Supplier already exists";
    }
  }

  const phoneErr = validatePhone(data.phoneNumber ?? "");
  if (phoneErr) errors.phoneNumber = phoneErr;

  const openingBalanceErr = validateNumber(
    data.openingBalance ?? "0",
    "Opening balance",
    0
  );
  if (openingBalanceErr) errors.openingBalance = openingBalanceErr;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePayment(
  amount: string,
  shopId: string,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (!shopId) errors.shopId = "Please select a shop";
  const amountErr = validateNumber(amount, "Payment amount", 0.01);
  if (amountErr) errors.amount = amountErr;
  return { isValid: Object.keys(errors).length === 0, errors };
}
