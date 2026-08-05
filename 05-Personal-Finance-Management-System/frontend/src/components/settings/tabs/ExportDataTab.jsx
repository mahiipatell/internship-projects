import { FileText, FileSpreadsheet } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import reportService from '../../../services/report.service';

const EXPORTS = [
  { key: 'csv', icon: FileText, label: 'CSV', action: () => reportService.downloadCsv() },
  { key: 'excel', icon: FileSpreadsheet, label: 'Excel', action: () => reportService.downloadExcel() },
  { key: 'pdf', icon: FileText, label: 'PDF Report', action: () => reportService.downloadPdf() },
];

function ExportDataTab() {
  return (
    <Card title="Export Data" subtitle="Download all of your transaction data.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {EXPORTS.map(({ key, icon: Icon, label, action }) => (
          <button
            key={key}
            onClick={action}
            className="flex flex-col items-center gap-2 rounded-2xl border border-olive-900/10 bg-white hover:border-primary-300 hover:-translate-y-0.5 transition-all p-5"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <Icon size={18} />
            </div>
            <span className="text-sm font-medium text-olive-900">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

export default ExportDataTab;
