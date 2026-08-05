import { useState } from 'react';
import { Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import GoalCard from '../components/goals/GoalCard';
import GoalForm from '../components/goals/GoalForm';
import { useSavingsGoals } from '../hooks/useSavingsGoals';

function SavingsGoals() {
  const { goals, loading, createGoal, updateGoal, contribute, deleteGoal } = useSavingsGoals();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreate = () => {
    setEditingGoal(null);
    setFormOpen(true);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const submitForm = async (data) => {
    setSubmitting(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
      } else {
        await createGoal(data);
      }
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    await deleteGoal(deletingGoal.id);
    setDeletingGoal(null);
  };

  const submitContribution = async () => {
    if (!contributionAmount || Number(contributionAmount) <= 0) return;
    await contribute(contributingGoal.id, Number(contributionAmount));
    setContributingGoal(null);
    setContributionAmount('');
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
          <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Savings Goals</h1>
          <p className="text-sm text-olive-600/70">Save toward the things that matter — a MacBook, a trip, an emergency fund.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState
            emoji="🎯"
            title="No savings goals yet"
            description="Create your first goal — like a MacBook, vacation, or emergency fund — and track your progress toward it."
            action={<Button onClick={openCreate}>+ Create Your First Goal</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={setDeletingGoal}
              onContribute={setContributingGoal}
            />
          ))}
        </div>
      )}

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editingGoal ? 'Edit Goal' : 'New Savings Goal'}>
        <GoalForm initialData={editingGoal} onSubmit={submitForm} onCancel={() => setFormOpen(false)} submitting={submitting} />
      </Modal>

      <Modal isOpen={!!deletingGoal} onClose={() => setDeletingGoal(null)} title="Delete Goal" maxWidth="max-w-sm">
        <p className="text-sm text-olive-700 dark:text-gray-300 mb-6">
          Delete "{deletingGoal?.name}"? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingGoal(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>

      <Modal isOpen={!!contributingGoal} onClose={() => setContributingGoal(null)} title="Add Contribution" maxWidth="max-w-sm">
        <div className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setContributingGoal(null)}>Cancel</Button>
            <Button onClick={submitContribution}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SavingsGoals;
