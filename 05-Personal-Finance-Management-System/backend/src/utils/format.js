function formatCurrencyPlain(value) {
  return `Rs. ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

module.exports = { formatCurrencyPlain };
