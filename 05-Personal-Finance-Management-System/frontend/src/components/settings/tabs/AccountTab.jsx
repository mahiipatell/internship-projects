import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import { useAccounts } from '../../../hooks/useAccounts';
import budgetService from '../../../services/budget.service';

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
];

function AccountForm({ initialData, onSubmit, onCancel }) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'bank');
  const [icon, setIcon] = useState(initialData?.icon || '🏦');

  return (
    <div className="space-y-4">
      <Input label="Account Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HDFC Savings" />
      <Select
        label="Account Type"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setIcon(ACCOUNT_TYPES.find((t) => t.value === e.target.value)?.icon || '🏦');
        }}
      >
        {ACCOUNT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
        ))}
      </Select>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ name, type, icon })} disabled={!name.trim()}>
          {initialData ? 'Update' : 'Add Account'}
        </Button>
      </div>
    </div>
  );
}

function AccountTab() {
  const { accounts, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [planMessage, setPlanMessage] = useState('');

  const submitForm = async (data) => {
    if (editingAccount) await updateAccount(editingAccount.id, data);
    else await createAccount(data);
    setFormOpen(false);
    setEditingAccount(null);
  };

  const confirmDelete = async () => {
    await deleteAccount(deletingAccount.id);
    setDeletingAccount(null);
  };

  const handleResetPlan = async () => {
    await budgetService.resetBudget();
    setPlanMessage('Monthly Financial Plan has been reset.');
  };

  return (
    <div className="space-y-6">
      <Card
        title="Financial Accounts"
        subtitle="Cash, bank accounts, credit cards, and wallets — every transaction can belong to one."
        action={
          <Button onClick={() => { setEditingAccount(null); setFormOpen(true); }}>
            <Plus size={16} /> Add Account
          </Button>
        }
      >
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between rounded-xl bg-cream px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{account.icon}</span>
                <div>
                  <p className="text-sm font-medium text-olive-900">{account.name}</p>
                  <p className="text-xs text-olive-600/60 capitalize">{account.type.replace('_', ' ')}</p>
                </div>
                {account.is_default && (
                  <span className="text-[10px] font-semibold uppercase text-primary-700 bg-primary-100 rounded-full px-2 py-0.5">Default</span>
                )}
              </div>
              {!account.is_default && (
                <div className="flex gap-1">
                  <button onClick={() => { setEditingAccount(account); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-white text-olive-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeletingAccount(account)} className="p-1.5 rounded-lg hover:bg-expense/10 text-expense">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Monthly Financial Plan">
        {planMessage && (
          <div className="mb-4 text-sm text-primary-700 bg-primary-100 rounded-xl px-4 py-2.5">{planMessage}</div>
        )}
        <p className="text-sm text-olive-600/70 mb-4">
          Manage income, savings goal, and allocations from the Monthly Financial Plan page.
        </p>
        <Button variant="danger" onClick={handleResetPlan}>Reset Financial Plan</Button>
      </Card>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingAccount ? 'Edit Account' : 'Add Account'} maxWidth="max-w-sm">
        <AccountForm initialData={editingAccount} onSubmit={submitForm} onCancel={() => setFormOpen(false)} />
      </Modal>

      <Modal isOpen={!!deletingAccount} onClose={() => setDeletingAccount(null)} title="Delete Account" maxWidth="max-w-sm">
        <p className="text-sm text-olive-700 mb-6">
          Delete "{deletingAccount?.name}"? Transactions linked to it will keep their data but show no account.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingAccount(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

export default AccountTab;
