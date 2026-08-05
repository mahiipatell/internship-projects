import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import ImportWizard from '../components/import/ImportWizard';

function Import() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Import Transactions</h1>
          <p className="text-sm text-olive-600/70">
            Bring in transactions from a bank statement, credit card, Excel, UPI export, or PDF.
          </p>
        </div>
        <Link to="/import-history" className="flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline">
          <History size={15} /> View Import History
        </Link>
      </div>
      <ImportWizard />
    </div>
  );
}

export default Import;
