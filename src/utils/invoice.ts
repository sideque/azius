import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { SaleWithDetails } from "../types";
import { formatCurrency, formatDateTime } from "./formatters";

export interface InvoiceOptions {
  includeOwnerName?: boolean;
  ownerName?: string;
}

export function generateInvoiceHtml(
  sale: SaleWithDetails,
  options?: InvoiceOptions,
): string {
  const itemsHtml = sale.items
    .map(
      (item) => `
      <tr>
        <td>
          <div class="item-desc">${item.productName}</div>
          <div class="item-qty-rate">${item.quantity} x ${formatCurrency(item.rate)}</div>
        </td>
        <td class="item-total">${formatCurrency(item.total)}</td>
      </tr>
    `
    )
    .join("");

  const showOwnerInfo = Boolean(options?.includeOwnerName && options?.ownerName);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice</title>
  <style>
    @page {
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    .receipt-container {
      margin: 0 auto;
      padding: 10px;
      width: 280px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.3;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
    }
    .shop-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 3px 0;
      margin-bottom: 10px;
    }
    .meta-table {
      width: 100%;
      margin-bottom: 10px;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 1px 0;
      font-size: 10px;
      vertical-align: top;
    }
    .meta-label {
      color: #555;
      width: 80px;
    }
    .meta-value {
      font-weight: 600;
      text-align: right;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
    }
    .items-table td {
      padding: 5px 0;
      font-size: 10px;
      border-bottom: 1px dashed #eee;
    }
    .item-desc {
      font-weight: 600;
      color: #111;
    }
    .item-qty-rate {
      color: #555;
      font-size: 9px;
      margin-top: 1px;
    }
    .item-total {
      text-align: right;
      font-weight: 700;
      font-size: 11px;
      vertical-align: middle;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .summary-table td {
      padding: 2px 0;
      font-size: 10px;
    }
    .summary-label {
      color: #444;
    }
    .summary-value {
      text-align: right;
      font-weight: 600;
    }
    .grand-total-row td {
      border-top: 1px double #000;
      padding-top: 6px;
    }
    .grand-total-label {
      font-size: 12px;
      font-weight: 800;
    }
    .grand-total-value {
      font-size: 14px;
      font-weight: 800;
      color: #000;
      text-align: right;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 9px;
      color: #555;
    }
    .thankyou {
      font-size: 10px;
      font-weight: 700;
      margin-bottom: 3px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      ${showOwnerInfo ? `<div class="shop-name">SAIF MARKETING</div>` : ""}
      <div class="title">${showOwnerInfo ? "Sales Invoice" : "Estimate Bill"}</div>
    </div>

    <table class="meta-table">
      <tr>
        <td class="meta-label">Invoice:</td>
        <td class="meta-value">${sale.invoiceNumber}</td>
      </tr>
      <tr>
        <td class="meta-label">Customer:</td>
        <td class="meta-value">${sale.shopName}</td>
      </tr>
      ${
        showOwnerInfo
          ? `
      <tr>
        <td class="meta-label">Owner:</td>
        <td class="meta-value">${options!.ownerName}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td class="meta-label">Date:</td>
        <td class="meta-value">${formatDateTime(sale.createdAt)}</td>
      </tr>
    </table>

    <div class="divider"></div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 70%;">Item Description</th>
          <th style="text-align: right; width: 30%;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="divider"></div>

    <table class="summary-table">
      <tr>
        <td class="summary-label">Subtotal:</td>
        <td class="summary-value">${formatCurrency(sale.subtotal)}</td>
      </tr>
      ${
        sale.discount > 0
          ? `
      <tr>
        <td class="summary-label">Discount:</td>
        <td class="summary-value" style="color: #d93025;">-${formatCurrency(sale.discount)}</td>
      </tr>
      `
          : ""
      }
      <tr class="grand-total-row">
        <td class="grand-total-label">Grand Total:</td>
        <td class="grand-total-value">${formatCurrency(sale.grandTotal)}</td>
      </tr>
    </table>

    <div class="divider"></div>

    <div class="footer">
      <div class="thankyou">Thank you for shopping with us!</div>
      ${showOwnerInfo ? `<div>Powered by SAIF MARKETING</div>` : ""}
    </div>
  </div>
</body>
</html>
`;
}

/** Generates the invoice PDF and opens the native share sheet. Returns false if sharing isn't available. */
export async function shareInvoicePdf(
  sale: SaleWithDetails,
  options?: InvoiceOptions,
): Promise<boolean> {
  const html = generateInvoiceHtml(sale, options);
  const { base64 } = await Print.printToFileAsync({
    html,
    width: 300,
    height: 380 + sale.items.length * 45,
    base64: true,
  });

  if (!base64) {
    throw new Error("No base64 data returned from PDF generation");
  }

  // Save the PDF base64 directly to our custom cache directory file.
  // This completely avoids any Android file-locking or permission issues with the /Print/ folder!
  const cleanInvoiceNum = sale.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  const targetUri = `${FileSystem.cacheDirectory}${cleanInvoiceNum}.pdf`;

  await FileSystem.writeAsStringAsync(targetUri, base64, {
    encoding: "base64",
  });

  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }

  await Sharing.shareAsync(targetUri, {
    mimeType: "application/pdf",
    dialogTitle: `Share Invoice ${sale.invoiceNumber}`,
    UTI: "com.adobe.pdf",
  });
  return true;
}

export async function printInvoice(
  sale: SaleWithDetails,
  options?: InvoiceOptions,
): Promise<void> {
  const html = generateInvoiceHtml(sale, options);
  await Print.printAsync({ html });
}
