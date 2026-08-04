import { useEffect, useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import AllocationCard from '../components/budget/AllocationCard';
import AllocationForm from '../components/budget/AllocationForm';
import SavingsGoalCard from '../components/budget/SavingsGoalCard';
import IncomeGoalForm from '../components/budget/IncomeGoalForm';
import budgetService from '../services/budget.service';
import { formatCurrency } from '../utils/formatCurrency';

function Budget() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);
  const [allocationFormOpen, setAllocationFormOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [deletingAllocation, setDeletingAllocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    budgetService.getBudget().then((data) => {
      setBudget(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openAddAllocation = () => {
    setEditingAllocation(null);
    setAllocationFormOpen(true);
  };

  const openEditAllocation = (allocation) => {
    setEditingAllocation(allocation);
    setAllocationFormOpen(true);
  };

  const submitAllocation = async (data) => {
    setSubmitting(true);
    try {
      const updated = editingAllocation
        ? await budgetService.updateAllocation(editingAllocation.id, data)
        : await budgetService.addAllocation(data);
      setBudget(updated);
      setAllocationFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteAllocation = async () => {
    const updated = await budgetService.deleteAllocation(deletingAllocation.id);
    setBudget(updated);
    setDeletingAllocation(null);
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
          <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">
            Monthly Financial Plan
          </h1>
          <p className="text-sm text-olive-600/70">
            {budget.enabled
              ? 'Build your own allocations and track them against your income.'
              : 'Optional — plan your income, build custom allocations, and set a savings goal.'}
          </p>
        </div>
        {budget.enabled && (
          <Button variant="secondary" onClick={() => setIncomeFormOpen(true)}>
            Edit Income & Goal
          </Button>
        )}
      </div>

      {budget.enabled ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Monthly Income</p>
              <p className="text-lg font-bold text-olive-900 dark:text-gray-100 mt-1">
                {formatCurrency(budget.monthlyIncome)}
              </p>
            </Card>
            <Card>
              <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Allocated</p>
              <p className="text-lg font-bold text-olive-900 dark:text-gray-100 mt-1">
                {formatCurrency(budget.totalAllocated)}
              </p>
            </Card>
            <Card>
              <p className="text-[11px] uppercase tracking-wide text-olive-600/60">
                Remaining to Allocate
              </p>
              <p
                className={`text-lg font-bold mt-1 ${
                  budget.unallocatedAmount < 0 ? 'text-expense' : 'text-income'
                }`}
              >
                {formatCurrency(budget.unallocatedAmount)}
              </p>
            </Card>
            <Card>
              <p className="text-[11px] uppercase tracking-wide text-olive-600/60">Total Spent</p>
              <p className="text-lg font-bold text-expense mt-1">
                {formatCurrency(budget.totalSpent)}
              </p>
            </Card>
          </div>

          {budget.isOverAllocated && (
            <div className="flex items-center gap-2 text-sm font-medium text-expense bg-expense/10 rounded-xl px-4 py-3">
              <AlertTriangle size={16} />
              You have allocated more than your monthly income.
            </div>
          )}

          <SavingsGoalCard
            savingsGoal={budget.savingsGoal}
            actualSavings={budget.actualSavings}
            savingsPercentage={budget.savingsPercentage}
            savingsGoalReached={budget.savingsGoalReached}
          />

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-olive-900 dark:text-gray-100">Allocations</h2>
            <Button onClick={openAddAllocation}>
              <Plus size={16} /> Add Allocation
            </Button>
          </div>

          {budget.allocations.length === 0 ? (
            <Card>
              <EmptyState
                emoji="📅"
                title="No allocations yet"
                description="Create allocations like Bills, Groceries, or Gym — spending in the matching transaction category will track automatically."
                action={<Button onClick={openAddAllocation}>+ Add Your First Allocation</Button>}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {budget.allocations.map((allocation) => (
                <AllocationCard
                  key={allocation.id}
                  allocation={allocation}
                  onEdit={openEditAllocation}
                  onDelete={setDeletingAllocation}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-2xl flex items-center justify-center mx-auto mb-4">
            📅
          </div>
          <h2 className="font-semibold text-olive-900 dark:text-gray-100 mb-1">
            Your Monthly Financial Plan is Off
          </h2>
          <p className="text-sm text-olive-600/70 max-w-sm mx-auto mb-6">
            Turn it on to set a monthly income, build your own custom allocations, and track a
            savings goal — with progress bars and overspending alerts.
          </p>
          <Button onClick={() => setIncomeFormOpen(true)} className="mx-auto">
            Start My Financial Plan
          </Button>
        </Card>
      )}

      <Modal
        isOpen={incomeFormOpen}
        onClose={() => setIncomeFormOpen(false)}
        title="Monthly Income & Savings Goal"
      >
        <IncomeGoalForm
          existing={budget.enabled ? budget : null}
          onSaved={(updated) => {
            setBudget(updated);
            setIncomeFormOpen(false);
          }}
          onCancel={() => setIncomeFormOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={allocationFormOpen}
        onClose={() => setAllocationFormOpen(false)}
        title={editingAllocation ? 'Edit Allocation' : 'Add Allocation'}
      >
        <AllocationForm
          initialData={editingAllocation}
          onSubmit={submitAllocation}
          onCancel={() => setAllocationFormOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <Modal
        isOpen={!!deletingAllocation}
        onClose={() => setDeletingAllocation(null)}
        title="Delete Allocation"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-olive-700 dark:text-gray-300 mb-6">
          Delete "{deletingAllocation?.name}"? This won&apos;t delete past transactions, only the
          budget allocation.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingAllocation(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeleteAllocation}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Budget;
