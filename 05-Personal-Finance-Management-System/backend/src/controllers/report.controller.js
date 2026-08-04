const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const TransactionModel = require('../models/transaction.model');
const { formatCurrencyPlain } = require('../utils/format');

const exportCsv = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const transactions = await TransactionModel.listAllForExport(req.user.id, { from, to });

  const parser = new Parser({
    fields: ['title', 'category', 'type', 'amount', 'date', 'notes'],
  });
  const csv = parser.parse(transactions);

  res.header('Content-Type', 'text/csv');
  res.attachment('transactions.csv');
  res.send(csv);
});

const exportExcel = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const transactions = await TransactionModel.listAllForExport(req.user.id, { from, to });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');

  sheet.columns = [
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };

  transactions.forEach((t) => {
    sheet.addRow({
      title: t.title,
      category: t.category,
      type: t.type,
      amount: Number(t.amount),
      date: new Date(t.date).toISOString().split('T')[0],
      notes: t.notes || '',
    });
  });

  res.header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.attachment('transactions.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

const exportPdf = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const transactions = await TransactionModel.listAllForExport(req.user.id, { from, to });
  const summary = await TransactionModel.getSummary(req.user.id, { from, to });

  res.header('Content-Type', 'application/pdf');
  res.attachment('expense-report.pdf');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(20).text('Expense Tracker — Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#666').text(`Generated on ${new Date().toDateString()}`, {
    align: 'center',
  });
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(12);
  doc.text(`Total Income:   ${formatCurrencyPlain(summary.income)}`);
  doc.text(`Total Expense:  ${formatCurrencyPlain(summary.expense)}`);
  doc.text(`Net Balance:    ${formatCurrencyPlain(summary.balance)}`);
  doc.moveDown(1);

  doc.fontSize(14).text('Transactions', { underline: true });
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const columns = { date: 40, title: 120, category: 280, type: 380, amount: 450 };

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Date', columns.date, tableTop);
  doc.text('Title', columns.title, tableTop);
  doc.text('Category', columns.category, tableTop);
  doc.text('Type', columns.type, tableTop);
  doc.text('Amount', columns.amount, tableTop);
  doc.moveDown(0.5);
  doc.font('Helvetica');

  transactions.forEach((t) => {
    if (doc.y > 720) doc.addPage();
    const y = doc.y;
    doc.text(new Date(t.date).toISOString().split('T')[0], columns.date, y, { width: 75 });
    doc.text(t.title, columns.title, y, { width: 150 });
    doc.text(t.category, columns.category, y, { width: 90 });
    doc.text(t.type, columns.type, y, { width: 60 });
    doc.text(formatCurrencyPlain(t.amount), columns.amount, y, { width: 90 });
    doc.moveDown(0.6);
  });

  doc.end();
});

module.exports = { exportCsv, exportExcel, exportPdf };
