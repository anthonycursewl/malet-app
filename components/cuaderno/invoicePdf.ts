import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { Invoice, InvoiceStatus, StoreCurrency, invoiceStatusLabel } from '@/shared/entities/SalesModule';
import { formatMoney, formatSaleDate } from './format';
import { getReceiptLogoUri, RECEIPT_LOGO_FALLBACK_URL } from './receiptPdf';

export interface InvoicePdfData {
    invoice: Invoice;
    storeName: string;
    currency: StoreCurrency;
    storePhone?: string | null;
    storeEmail?: string | null;
    storeAddress?: string | null;
}

const esc = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const INVOICE_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827; margin: 0; padding: 32px 30px; font-size: 11px;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .doc-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 10px; }
  .status {
    display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.6px; padding: 3px 8px; border-radius: 999px; margin-left: 6px;
  }
  .meta { margin-bottom: 4px; }
  .meta-label { color: #6b7280; }
  .meta-value { font-weight: 600; }
  .brand { width: 44px; height: 45px; }
  .divider { height: 1px; background: #d1d5db; margin: 18px 0; }
  .billing-label { color: #6b7280; margin-bottom: 3px; }
  .billing-name { font-weight: 700; font-size: 13px; }
  .billing-store { color: #4b5563; margin-top: 2px; }
  .issuer-line { color: #6b7280; font-size: 10px; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  thead th {
    text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.4px;
    color: #6b7280; background: #f9fafb; border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb; padding: 7px 8px;
  }
  tbody td { padding: 9px 8px; border-bottom: 1px solid #f3f4f6; }
  .num { text-align: right; }
  .center { text-align: center; }
  .totals { margin-top: 12px; margin-left: 52%; }
  .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .totals-label { color: #6b7280; }
  .totals-value { font-weight: 700; }
  .notes-title { font-size: 12px; font-weight: 800; margin-top: 22px; }
  .notes { color: #4b5563; margin-top: 4px; white-space: pre-wrap; }
  .footer { margin-top: 40px; color: #9ca3af; font-size: 9px; text-align: right; }
`;

const STATUS_COLOR: Record<InvoiceStatus, string> = {
    pending: '#b45309',
    paid: '#15803d',
    cancelled: '#6b7280',
};

/** Construye el HTML de la factura con el formato impreso. */
export function buildInvoiceHtml(
    { invoice, storeName, currency, storePhone, storeEmail, storeAddress }: InvoicePdfData,
    logoUri: string | null = null,
): string {
    const lines = invoice.lines ?? [];
    const logoSrc = logoUri ?? RECEIPT_LOGO_FALLBACK_URL;
    const issuerLines = [storePhone, storeEmail, storeAddress]
        .filter((value): value is string => !!value && value.trim().length > 0)
        .map((value) => `<div class="issuer-line">${esc(value)}</div>`)
        .join('');

    const lineRows = lines.length
        ? lines
              .map(
                  (line) => `
        <tr>
          <td>${esc(line.name)}</td>
          <td class="center">${esc(line.quantity)}</td>
          <td class="num">${esc(formatMoney(line.unit_price, currency))}</td>
          <td class="num">${esc(formatMoney(line.total, currency))}</td>
        </tr>`,
              )
              .join('')
        : `<tr><td colspan="4" class="empty">Esta factura no tiene conceptos registrados.</td></tr>`;

    const status = invoiceStatusLabel(invoice.status);
    const statusColor = STATUS_COLOR[invoice.status] ?? '#6b7280';

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><style>${INVOICE_CSS}</style></head>
<body>
  <div class="header">
    <div>
      <div class="doc-title">Factura
        <span class="status" style="color:${statusColor};background:${statusColor}18">${esc(status)}</span>
      </div>
      <div class="meta">
        <span class="meta-label">Número de factura</span>&nbsp;
        <span class="meta-value">${esc(invoice.number)}</span>
      </div>
      <div class="meta">
        <span class="meta-label">Fecha de emisión</span>&nbsp;
        <span class="meta-value">${esc(formatSaleDate(invoice.issued_at))}</span>
      </div>
      ${
          invoice.due_at
              ? `<div class="meta"><span class="meta-label">Vence</span>&nbsp;<span class="meta-value">${esc(formatSaleDate(invoice.due_at))}</span></div>`
              : ''
      }
    </div>
    <img class="brand" src="${logoSrc}" alt="Breadriuss" />
  </div>

  <div class="divider"></div>

  <div class="billing-label">Facturar a</div>
  <div class="billing-name">${esc(invoice.customer_name?.trim() || 'Cliente no especificado')}</div>
  <div class="billing-store">${esc(storeName)}</div>
  ${issuerLines}

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th class="center" style="width:42px">Cant.</th>
        <th class="num" style="width:96px">Precio unitario</th>
        <th class="num" style="width:96px">Importe</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span class="totals-label">Subtotal</span>
      <span class="totals-value">${esc(formatMoney(invoice.subtotal, currency))}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Total</span>
      <span class="totals-value">${esc(formatMoney(invoice.total, currency))}</span>
    </div>
  </div>

  ${invoice.notes ? `<div class="notes-title">Notas</div><div class="notes">${esc(invoice.notes)}</div>` : ''}

  <div class="footer">Documento generado por Malet · Breadriuss</div>
</body>
</html>`;
}

/** Genera el PDF de la factura y abre la hoja de compartir del sistema. */
export async function shareInvoicePdf(data: InvoicePdfData): Promise<{ error: string | null }> {
    try {
        const logoUri = await getReceiptLogoUri();
        const html = buildInvoiceHtml(data, logoUri);

        const { uri } = await Print.printToFileAsync({ html });

        if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
            await Print.printAsync({ html });
            return { error: null };
        }

        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Factura ${data.invoice.number}`,
            UTI: 'com.adobe.pdf',
        });

        return { error: null };
    } catch (e: any) {
        const message = e?.message ?? 'No se pudo generar el PDF de la factura.';
        if (!message.includes('did not share')) {
            Alert.alert('Malet | Error', message);
            return { error: message };
        }
        return { error: null };
    }
}
