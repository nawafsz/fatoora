import QRCode from "qrcode";

// ZATCA TLV format tags
const TAG_SELLER_NAME = 1;
const TAG_VAT_NUMBER = 2;
const TAG_TIME_STAMP = 3;
const TAG_INVOICE_TOTAL = 4;
const TAG_VAT_TOTAL = 5;

function encodeTLV(tag: number, value: string): Buffer {
  let valueBuffer = Buffer.from(value, "utf-8");
  if (valueBuffer.length > 255) {
    valueBuffer = valueBuffer.subarray(0, 255);
  }
  const tagBuffer = Buffer.alloc(1);
  tagBuffer.writeUInt8(tag);

  const lengthBuffer = Buffer.alloc(1);
  lengthBuffer.writeUInt8(valueBuffer.length);

  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

export function generateZatcaTLV({
  sellerName,
  vatNumber,
  timestamp,
  invoiceTotal,
  vatTotal,
}: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: string;
  vatTotal: string;
}): string {
  const tlv = Buffer.concat([
    encodeTLV(TAG_SELLER_NAME, sellerName),
    encodeTLV(TAG_VAT_NUMBER, vatNumber),
    encodeTLV(TAG_TIME_STAMP, timestamp),
    encodeTLV(TAG_INVOICE_TOTAL, invoiceTotal),
    encodeTLV(TAG_VAT_TOTAL, vatTotal),
  ]);

  return tlv.toString("base64");
}

export async function generateQRCode(data: string): Promise<string> {
  const qr = await QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: { dark: "#1a5632", light: "#ffffff" },
  });
  return qr;
}

export async function generateInvoiceQR({
  sellerName,
  vatNumber,
  timestamp,
  total,
  vatTotal,
}: {
  sellerName: string;
  vatNumber: string;
  timestamp: Date;
  total: number;
  vatTotal: number;
}): Promise<string> {
  const isoTime = timestamp.toISOString().replace(/\.\d{3}Z$/, "Z");
  const totalStr = total.toFixed(2);
  const vatStr = vatTotal.toFixed(2);

  const tlvBase64 = generateZatcaTLV({
    sellerName,
    vatNumber,
    timestamp: isoTime,
    invoiceTotal: totalStr,
    vatTotal: vatStr,
  });

  return generateQRCode(tlvBase64);
}
