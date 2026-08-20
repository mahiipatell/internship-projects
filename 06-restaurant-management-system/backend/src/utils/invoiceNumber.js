/**
 * Generates a human-friendly, sortable invoice number, e.g. INV-20260805-0001
 */
const generateInvoiceNumber = (billId) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(billId).padStart(4, '0');
  return `INV-${yyyy}${mm}${dd}-${seq}`;
};

module.exports = { generateInvoiceNumber };
