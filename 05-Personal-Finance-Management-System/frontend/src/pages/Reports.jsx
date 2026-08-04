import { FileText, FileSpreadsheet } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import reportService from '../services/report.service';

const REPORTS = [
  {
    key: 'csv',
    icon: FileText,
    title: 'CSV Export',
    description: 'A plain spreadsheet-friendly file of all your transactions.',
    action: () => reportService.downloadCsv(),
  },
  {
    key: 'excel',
    icon: FileSpreadsheet,
    title: 'Excel Export',
    description: 'A formatted .xlsx workbook with all your transactions.',
    action: () => reportService.downloadExcel(),
  },
  {
    key: 'pdf',
    icon: FileText,
    title: 'PDF Report',
    description: 'A printable summary report with totals and a transaction table.',
    action: () => reportService.downloadPdf(),
  },
];

function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-olive-600/70">Download your transaction data in the format you need.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {REPORTS.map(({ key, icon: Icon, title, description, action }) => (
          <Card key={key} hover className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
              <Icon size={22} />
            </div>
            <h3 className="font-semibold text-olive-900 dark:text-gray-100 mb-1">{title}</h3>
            <p className="text-xs text-olive-600/60 mb-4">{description}</p>
            <Button variant="secondary" onClick={action} className="w-full">
              Download
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Reports;
