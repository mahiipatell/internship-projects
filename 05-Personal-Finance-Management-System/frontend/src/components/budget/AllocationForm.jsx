import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { SUGGESTED_ALLOCATION_ICONS } from '../../utils/constants';

function AllocationForm({ initialData, onSubmit, onCancel, submitting }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      icon: initialData?.icon || '🏷️',
      name: initialData?.name || '',
      amount: initialData?.allocated || '',
    },
  });

  const icon = watch('icon');

  const submit = (data) => {
    onSubmit({ ...data, amount: Number(data.amount) });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_ALLOCATION_ICONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setValue('icon', emoji)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
              ${icon === emoji ? 'bg-primary-200 shadow-soft scale-105' : 'bg-cream hover:bg-primary-100'}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-3">
        <Input label="Icon" maxLength={4} {...register('icon')} />
        <Input
          label="Allocation Name"
          placeholder="e.g. Bills, Gym, Emergency Fund"
          error={errors.name?.message}
          {...register('name', { required: 'A name is required' })}
        />
      </div>

      <Input
        label="Amount (₹)"
        type="number"
        step="0.01"
        placeholder="e.g. 10000"
        error={errors.amount?.message}
        {...register('amount', {
          required: 'Amount is required',
          min: { value: 0, message: 'Amount must be zero or more' },
        })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : initialData ? 'Update Allocation' : 'Add Allocation'}
        </Button>
      </div>
    </form>
  );
}

export default AllocationForm;
