import { useState } from 'react';
import { Plus, Pencil, Trash2, Repeat } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import RecurringForm from '../components/recurring/RecurringForm';
import { useRecurring } from '../hooks/useRecurring';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

const FREQUENCY_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

function Recurring() {
  const { rules, loading, createRule, updateRule, deleteRule } = useRecurring();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const submitForm = async (data) => {
    setSubmitting(true);
    try {
      if (editingRule) {
        await updateRule(editingRule.id, { ...data, isActive: editingRule.is_active });
      } else {
        await createRule(data);
      }
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (rule) => {
    await updateRule(rule.id, {
      categoryId: rule.category_id,
      accountId: rule.account_id,
      title: rule.title,
      amount: rule.amount,
      type: rule.type,
      frequency: rule.frequency,
      isActive: !rule.is_active,
      notes: rule.notes,
    });
  };

  const confirmDelete = async () => {
    await deleteRule(deletingRule.id);
    setDeletingRule(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Recurring Transactions</h1>
          <p className="text-sm text-olive-600/70">Rent, subscriptions, and bills that repeat automatically.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Recurring
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🔁"
            title="No recurring transactions yet"
            description="Set up rent, Netflix, electricity, or gym payments once — we'll create the transaction automatically each time it's due."
            action={<Button onClick={openCreate}>+ Add Your First Recurring Item</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.is_active ? 'opacity-50' : ''}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <Repeat size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-olive-900 dark:text-gray-100">{rule.title}</p>
                    <p className="text-xs text-olive-600/60">
                      {rule.category_name} • {FREQUENCY_LABEL[rule.frequency]} • Next: {formatDate(rule.next_run_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-semibold ${rule.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}
                  </span>
                  <button
                    onClick={() => toggleActive(rule)}
                    className="text-xs font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {rule.is_active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => { setEditingRule(rule); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-cream text-olive-600">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeletingRule(rule)} className="p-1.5 rounded-lg hover:bg-expense/10 text-expense">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingRule ? 'Edit Recurring Item' : 'Add Recurring Item'}>
        <RecurringForm initialData={editingRule} onSubmit={submitForm} onCancel={() => setFormOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!deletingRule} onClose={() => setDeletingRule(null)} title="Delete Recurring Item" maxWidth="max-w-sm">
        <p className="text-sm text-olive-700 dark:text-gray-300 mb-6">
          Delete "{deletingRule?.title}"? Past transactions it already created will stay.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingRule(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

export default Recurring;
