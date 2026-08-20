const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');
const billingService = require('./billing.service');

const INVOICE_DIR = path.join(__dirname, '..', '..', 'invoices');
if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });

/**
 * Builds a printable PDF invoice for a paid/pending bill using PDFKit,
 * writes it to disk, and records the invoice row (idempotent per bill).
 */
const generateInvoice = async (billId) => {
  const bill = await billingService.getBillById(billId);

  let invoiceRow = (await query('SELECT * FROM invoices WHERE bill_id = $1', [billId])).rows[0];
  if (!invoiceRow) {
    const invoiceNumber = generateInvoiceNumber(billId);
    const inserted = await query(
      `INSERT INTO invoices (bill_id, invoice_number) VALUES ($1, $2) RETURNING *`,
      [billId, invoiceNumber]
    );
    invoiceRow = inserted.rows[0];
  }

  const fileName = `${invoiceRow.invoice_number}.pdf`;
  const filePath = path.join(INVOICE_DIR, fileName);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('The Restaurant', { align: 'left' });
    doc.fontSize(10).fillColor('#555').text('123 MG Road, City, State - 000001', { align: 'left' });
    doc.moveDown(1.5);

    doc.fillColor('#000').fontSize(14).text('TAX INVOICE', { align: 'right' });
    doc.fontSize(10)
      .text(`Invoice #: ${invoiceRow.invoice_number}`, { align: 'right' })
      .text(`Date: ${new Date(bill.created_at).toLocaleString()}`, { align: 'right' })
      .text(`Table: ${bill.table_number}`, { align: 'right' });
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#000');
    doc.text('Item', 50, tableTop, { width: 220, bold: true });
    doc.text('Qty', 280, tableTop, { width: 60 });
    doc.text('Unit Price', 350, tableTop, { width: 90 });
    doc.text('Amount', 450, tableTop, { width: 90 });
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#ccc').stroke();

    let y = tableTop + 22;
    bill.items.forEach((item) => {
      const amount = (Number(item.quantity) * Number(item.unit_price)).toFixed(2);
      doc.text(item.item_name, 50, y, { width: 220 });
      doc.text(String(item.quantity), 280, y, { width: 60 });
      doc.text(Number(item.unit_price).toFixed(2), 350, y, { width: 90 });
      doc.text(amount, 450, y, { width: 90 });
      y += 20;
    });

    doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#ccc').stroke();
    y += 15;

    const line = (label, value, bold = false) => {
      doc.fontSize(bold ? 12 : 10).text(label, 350, y, { width: 90 });
      doc.text(value, 450, y, { width: 90 });
      y += bold ? 22 : 18;
    };

    line('Subtotal', Number(bill.subtotal).toFixed(2));
    if (Number(bill.discount_amount) > 0) {
      line(`Discount (${bill.discount_percent}%)`, `-${Number(bill.discount_amount).toFixed(2)}`);
    }
    line(`GST (${bill.gst_percent}%)`, Number(bill.gst_amount).toFixed(2));
    line('Grand Total', Number(bill.grand_total).toFixed(2), true);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#888').text(
      `Payment Method: ${bill.payment_method || 'N/A'}   |   Payment Status: ${bill.payment_status}`,
      50
    );
    doc.moveDown(1);
    doc.text('Thank you for dining with us!', 50, doc.y, { align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  await query('UPDATE invoices SET pdf_path = $1 WHERE id = $2', [filePath, invoiceRow.id]);

  return { ...invoiceRow, pdf_path: filePath, file_name: fileName };
};

const getInvoiceFilePath = async (invoiceNumber) => {
  const result = await query('SELECT * FROM invoices WHERE invoice_number = $1', [invoiceNumber]);
  if (!result.rows[0] || !result.rows[0].pdf_path || !fs.existsSync(result.rows[0].pdf_path)) {
    throw ApiError.notFound('Invoice file not found. Try generating it again.');
  }
  return result.rows[0].pdf_path;
};

module.exports = { generateInvoice, getInvoiceFilePath };
