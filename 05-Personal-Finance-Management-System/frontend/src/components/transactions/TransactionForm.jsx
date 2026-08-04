import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import categoryService from '../../services/category.service';
import { toInputDate } from '../../utils/formatDate';

function TransactionForm({ initialData, defaultType, onSubmit, onCancel, submitting }) {
  const [categories, setCategories] = useState([]);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: initialData?.title || '',
      amount: initialData?.amount || '',
      type: initialData?.type || defaultType || 'expense',
      categoryId: initialData?.category_id || '',
      date: initialData ? toInputDate(initialData.date) : toInputDate(new Date()),
      notes: initialData?.notes || '',
    },
  });

  const selectedType = watch('type');

  useEffect(() => {
    categoryService.getCategories(selectedType).then(setCategories);
  }, [selectedType]);

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        amount: initialData.amount,
        type: initialData.type,
        categoryId: initialData.category_id,
        date: toInputDate(initialData.date),
        notes: initialData.notes || '',
      });
    }
  }, [initialData, reset]);

  const submit = (data) => {
    onSubmit({ ...data, amount: Number(data.amount), categoryId: Number(data.categoryId) });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g. Grocery shopping"
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
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Amount must be greater than 0' },
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          error={errors.categoryId?.message}
          {...register('categoryId', { required: 'Category is required' })}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register('date', { required: 'Date is required' })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-olive-700 dark:text-gray-300">
          Notes (optional)
        </label>
        <textarea
          rows={3}
          className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Add any extra details..."
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : initialData ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}

export default TransactionForm;
