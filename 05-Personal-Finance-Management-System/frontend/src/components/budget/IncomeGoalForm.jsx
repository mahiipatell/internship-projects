import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';
import budgetService from '../../services/budget.service';

function IncomeGoalForm({ existing, onSaved, onCancel }) {
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      monthlyIncome: existing?.monthlyIncome || '',
      savingsGoal: existing?.savingsGoal || '',
    },
  });

  const submit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      const payload = {
        monthlyIncome: Number(data.monthlyIncome),
        savingsGoal: Number(data.savingsGoal) || 0,
      };
      const result = existing
        ? await budgetService.updateIncome(payload)
        : await budgetService.enableBudget(payload);
      onSaved(result);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not save your financial plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <p className="text-sm text-olive-600/70">
        Set your monthly income and an optional savings goal. You can add custom allocations
        (Bills, Groceries, Gym, and anything else) right after.
      </p>

      {serverError && (
        <div className="text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">{serverError}</div>
      )}

      <Input
        label="Monthly Income (₹)"
        type="number"
        step="0.01"
        placeholder="e.g. 50000"
        error={errors.monthlyIncome?.message}
        {...register('monthlyIncome', {
          required: 'Monthly income is required',
          min: { value: 1, message: 'Monthly income must be greater than 0' },
        })}
      />

      <Input
        label="Savings Goal (₹, optional)"
        type="number"
        step="0.01"
        placeholder="e.g. 10000"
        error={errors.savingsGoal?.message}
        {...register('savingsGoal', { min: { value: 0, message: 'Cannot be negative' } })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : existing ? 'Update Plan' : 'Start My Financial Plan'}
        </Button>
      </div>
    </form>
  );
}

export default IncomeGoalForm;
