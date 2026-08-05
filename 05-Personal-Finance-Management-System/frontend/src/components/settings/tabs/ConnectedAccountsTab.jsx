import Card from '../../ui/Card';

function ConnectedAccountsTab() {
  return (
    <Card title="Connected Accounts" subtitle="Link external accounts for automatic syncing.">
      <div className="text-center py-10">
        <div className="text-4xl mb-3">🔗</div>
        <p className="font-semibold text-olive-900 mb-1">Coming soon</p>
        <p className="text-sm text-olive-600/60 max-w-sm mx-auto">
          Direct bank and UPI account connections aren't available yet — for now, use the Import
          Center to bring in transactions from exported statements.
        </p>
      </div>
    </Card>
  );
}

export default ConnectedAccountsTab;
