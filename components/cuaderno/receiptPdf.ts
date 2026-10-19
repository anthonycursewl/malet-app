import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { Receipt, StoreCurrency } from '@/shared/entities/SalesModule';
import { formatMoney, formatSaleDate } from './format';

export interface ReceiptPdfData {
    receipt: Receipt;
    storeName: string;
    /** Moneda de la tienda (el recibo ya la trae en snapshot). */
    currency: StoreCurrency;
    /** Datos de contacto del emisor que se imprimen bajo el nombre. */
    storePhone?: string | null;
    storeEmail?: string | null;
    storeAddress?: string | null;
}

/** Logo de Breadriuss (negro sobre transparente) empaquetado en la app. */
const RECEIPT_LOGO = require('@/assets/images/malet/breadriuss_logo.png');

/** Respaldo público por si el asset no se pudiera leer del dispositivo. */
const RECEIPT_LOGO_FALLBACK_URL =
    'https://negocios.breadriuss.com/breadriuss/logo_breadriuss_light.png';

let logoCache: string | null | undefined;

/**
 * Logo como data URI base64 para que el PDF sea **autocontenido** y se pueda
 * generar/compartir sin conexión. Se resuelve una sola vez por sesión.
 */
async function getReceiptLogoUri(): Promise<string | null> {
    if (logoCache !== undefined) return logoCache;

    try {
        const asset = Asset.fromModule(RECEIPT_LOGO);
        if (!asset.localUri) {
            await asset.downloadAsync();
        }
        const uri = asset.localUri ?? asset.uri;
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        logoCache = `data:image/png;base64,${base64}`;
    } catch {
        logoCache = null;
    }

    return logoCache;
}

/** Escapa el contenido dinámico para que no rompa el HTML. */
const esc = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

/**
 * Hoja de estilos del recibo impreso. Se mantiene deliberadamente simple
 * (flexbox + bordes) porque los motores PDF (PDFKit/PdfRenderer) no soportan
 * toda la sintaxis de impresión del navegador; con esto el resultado es
 * consistente en Android e iOS.
 */
const RECEIPT_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    margin: 0;
    padding: 32px 30px;
    font-size: 11px;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .doc-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 10px; }
  .meta { margin-bottom: 4px; }
  .meta-label { color: #6b7280; }
  .meta-value { font-weight: 600; }
  .brand { width: 44px; height: 45px; }
  .divider { height: 1px; background: #d1d5db; margin: 18px 0; }
  .billing-label { color: #6b7280; margin-bottom: 3px; }
  .billing-name { font-weight: 700; font-size: 13px; }
  .billing-store { color: #4b5563; margin-top: 2px; }
  .issuer-line { color: #6b7280; font-size: 10px; margin-top: 1px; }
  .paid-line { font-weight: 700; font-size: 13px; margin-top: 20px; }
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
  .history-title { font-size: 13px; font-weight: 800; margin-top: 30px; }
  .empty { color: #9ca3af; text-align: center; padding: 12px 0; }
  .footer { margin-top: 40px; color: #9ca3af; font-size: 9px; text-align: right; }
`;

/** Construye el HTML del recibo con el formato impreso. */
export function buildReceiptHtml(
    {
        receipt,
        storeName,
        currency,
        storePhone,
        storeEmail,
        storeAddress,
    }: ReceiptPdfData,
    logoUri: string | null = null,
): string {
    const lines = receipt.lines ?? [];
    const payments = receipt.payments ?? [];
    // El logo va incrustado (base64) para no depender de la red.
    const logoSrc = logoUri ?? RECEIPT_LOGO_FALLBACK_URL;
    // Datos del emisor (tienda) bajo su nombre.
    const issuerLines = [storePhone, storeEmail, storeAddress]
        .filter((value): value is string => !!value && value.trim().length > 0)
        .map((value) => `<div class="issuer-line">${esc(value)}</div>`)
        .join('');

    const lineRows = lines.length
        ? lines
              .map(
                  (line) => `
        <tr>
          <td>${esc(line.product_name)}</td>
          <td class="center">${esc(line.quantity)}</td>
          <td class="num">${esc(formatMoney(line.unit_price, currency))}</td>
          <td class="num">${esc(formatMoney(line.total, currency))}</td>
        </tr>`
              )
              .join('')
        : `<tr><td colspan="4" class="empty">Esta venta no tiene líneas registradas.</td></tr>`;

    const paymentRows = payments
        .map(
            (payment) => `
        <tr>
          <td>${esc(payment.payment_method_name ?? 'Sin método')}</td>
          <td>${esc(formatSaleDate(payment.paid_at))}</td>
          <td class="num">${esc(formatMoney(payment.amount, currency))}</td>
        </tr>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><style>${RECEIPT_CSS}</style></head>
<body>
  <div class="header">
    <div>
      <div class="doc-title">Recibo</div>
      <div class="meta">
        <span class="meta-label">Número de recibo</span>&nbsp;
        <span class="meta-value">${esc(receipt.number)}</span>
      </div>
      <div class="meta">
        <span class="meta-label">Fecha de pago</span>&nbsp;
        <span class="meta-value">${esc(formatSaleDate(receipt.issued_at))}</span>
      </div>
    </div>
    <img class="brand" src="${logoSrc}" alt="Breadriuss" />
  </div>

  <div class="divider"></div>

  <div class="billing-label">Facturar a</div>
  <div class="billing-name">${esc(receipt.customer_name?.trim() || 'Cliente no especificado')}</div>
  <div class="billing-store">${esc(storeName)}</div>
  ${issuerLines}

  <div class="paid-line">
    ${esc(formatMoney(receipt.total, currency))} pagado el ${esc(formatSaleDate(receipt.issued_at))}
  </div>

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
      <span class="totals-value">${esc(formatMoney(receipt.subtotal, currency))}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Total</span>
      <span class="totals-value">${esc(formatMoney(receipt.total, currency))}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Importe pagado</span>
      <span class="totals-value">${esc(formatMoney(receipt.paid_amount, currency))}</span>
    </div>
  </div>

  ${
      payments.length
          ? `<div class="history-title">Historial de pagos</div>
  <table>
    <thead>
      <tr>
        <th>Método de pago</th>
        <th style="width:130px">Fecha</th>
        <th class="num" style="width:96px">Importe pagado</th>
      </tr>
    </thead>
    <tbody>${paymentRows}</tbody>
  </table>`
          : ''
  }

  <div class="footer">Documento generado por Malet · Breadriuss</div>
</body>
</html>`;
}

/**
 * Genera el PDF del recibo y abre la hoja de compartir del sistema
 * (guardar en archivos, enviar por WhatsApp, etc.). Todo en el dispositivo.
 */
export async function shareReceiptPdf(data: ReceiptPdfData): Promise<{ error: string | null }> {
    try {
        const logoUri = await getReceiptLogoUri();
        const html = buildReceiptHtml(data, logoUri);

        const { uri } = await Print.printToFileAsync({ html });

        if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
            await Print.printAsync({ html });
            return { error: null };
        }

        // Nombre claro al compartir el archivo.
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Recibo ${data.receipt.number}`,
            UTI: 'com.adobe.pdf',
        });

        return { error: null };
    } catch (e: any) {
        const message = e?.message ?? 'No se pudo generar el PDF del recibo.';
        if (!message.includes('did not share')) {
            Alert.alert('Malet | Error', message);
            return { error: message };
        }
        // El usuario cerró la hoja de compartir: no es un error.
        return { error: null };
    }
}
