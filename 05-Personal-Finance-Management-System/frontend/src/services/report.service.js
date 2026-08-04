import api from './api';

async function downloadFile(url, filename) {
  const response = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

const reportService = {
  downloadCsv: () => downloadFile('/reports/csv', 'transactions.csv'),
  downloadExcel: () => downloadFile('/reports/excel', 'transactions.xlsx'),
  downloadPdf: () => downloadFile('/reports/pdf', 'expense-report.pdf'),
};

export default reportService;
