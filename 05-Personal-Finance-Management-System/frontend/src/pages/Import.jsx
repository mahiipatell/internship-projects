import ImportWizard from '../components/import/ImportWizard';

function Import() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Import Transactions</h1>
        <p className="text-sm text-olive-600/70">
          Bring in transactions from a bank or credit card statement CSV export.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}

export default Import;
