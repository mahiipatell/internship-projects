import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import categoryService from '../../services/category.service';
import accountService from '../../services/account.service';

function RecurringForm({ initialData, onSubmit, onCancel, submitting }) {
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      amount: initialData?.amount || '',
      type: initialData?.type || 'expense',
      categoryId: initialData?.category_id || '',
      accountId: initialData?.account_id || '',
      frequency: initialData?.frequency || 'monthly',
      startDate: initialData?.start_date || new Date().toISOString().split('T')[0],
      notes: initialData?.notes || '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    categoryService.getCategories(selectedType).then(setCategories);
    accountService.getAccounts().then(setAccounts);
  }, [selectedType]);

  const submit = (data) => {
    onSubmit({ ...data, amount: Number(data.amount), categoryId: Number(data.categoryId), accountId: data.accountId || null });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g. Rent, Netflix, Gym Membership"
        error={errors.title?.message}
        {...register('title', { required: 'Title is required' })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Type" {...register('type', { required: true })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>
        <Input
          label="Amount"
          type="number"
          step="0.01"
          error={errors.amount?.message}
          {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be greater than 0' } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Category" error={errors.categoryId?.message} {...register('categoryId', { required: 'Category is required' })}>
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select label="Account (optional)" {...register('accountId')}>
          <option value="">No specific account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Frequency" {...register('frequency', { required: true })}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </Select>
        <Input label="Start Date" type="date" error={errors.startDate?.message} {...register('startDate', { required: 'Start date is required' })} />
      </div>

      <Input label="Notes (optional)" {...register('notes')} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : initialData ? 'Update' : 'Create Recurring Item'}</Button>
      </div>
    </form>
  );
}

export default RecurringForm;
