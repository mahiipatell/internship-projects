import { Link } from 'react-router-dom';
import { Upload, History } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

function ImportCenterTab() {
  return (
    <Card title="Import Center" subtitle="Bring in transactions from a bank, credit card, Excel, UPI, or PDF statement.">
      <div className="flex items-center gap-4 rounded-2xl bg-cream p-5 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
          <Upload size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-olive-900">Import transactions</p>
          <p className="text-xs text-olive-600/60">
            Bank Statement, Credit Card Statement, Excel, UPI Export (Google Pay, PhonePe, Paytm, BHIM), or PDF Statement
          </p>
        </div>
        <Link to="/import">
          <Button>Open Import Center</Button>
        </Link>
      </div>
      <Link to="/import-history" className="flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
        <History size={15} /> View Import History
      </Link>
    </Card>
  );
}

export default ImportCenterTab;
