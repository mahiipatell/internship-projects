import { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import IncomeGoalForm from '../components/budget/IncomeGoalForm';
import budgetService from '../services/budget.service';

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-primary-500' : 'bg-olive-900/10 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Settings() {
  const [budget, setBudget] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => budgetService.getBudget().then(setBudget);

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (enabled) => {
    setMessage('');
    if (enabled) {
      setFormOpen(true);
    } else {
      await budgetService.disableBudget();
      setMessage('Monthly Financial Plan disabled.');
      load();
    }
  };

  const handleReset = async () => {
    await budgetService.resetBudget();
    setResetConfirmOpen(false);
    setMessage('Monthly Financial Plan has been reset.');
    load();
  };

  if (!budget) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-olive-600/70">Manage your Monthly Financial Plan preferences.</p>
      </div>

      {message && (
        <div className="text-sm text-primary-700 bg-primary-100 rounded-xl px-4 py-2.5">
          {message}
        </div>
      )}

      <Card title="Monthly Financial Plan">
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-olive-900 dark:text-gray-100">
              Enable Monthly Financial Plan
            </p>
            <p className="text-xs text-olive-600/60">
              Set monthly income, build custom allocations, and track a savings goal.
            </p>
          </div>
          <ToggleSwitch checked={budget.enabled} onChange={handleToggle} />
        </div>

        {budget.enabled && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-olive-900/5 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setFormOpen(true)}>
              Edit Income & Goal
            </Button>
            <Button variant="danger" onClick={() => setResetConfirmOpen(true)}>
              Reset Plan
            </Button>
          </div>
        )}
      </Card>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Monthly Income & Savings Goal">
        <IncomeGoalForm
          existing={budget.enabled ? budget : null}
          onSaved={() => {
            setFormOpen(false);
            setMessage('Plan saved.');
            load();
          }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset Monthly Financial Plan"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-olive-700 dark:text-gray-300 mb-6">
          This will clear your monthly income, savings goal, and all allocations. This cannot be
          undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setResetConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;
