import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';

const SUGGESTED_ICONS = ['🎯', '💻', '✈️', '🚨', '🚗', '🏡', '💍', '🎓'];

function GoalForm({ initialData, onSubmit, onCancel, submitting }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      icon: initialData?.icon || '🎯',
      name: initialData?.name || '',
      targetAmount: initialData?.target || '',
      targetDate: initialData?.targetDate || '',
    },
  });

  const icon = watch('icon');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_ICONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setValue('icon', emoji)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
              ${icon === emoji ? 'bg-sage-100 shadow-soft scale-105' : 'bg-cream hover:bg-sage-50'}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-3">
        <Input label="Icon" maxLength={4} {...register('icon')} />
        <Input
          label="Goal Name"
          placeholder="e.g. MacBook, Vacation, Emergency Fund"
          error={errors.name?.message}
          {...register('name', { required: 'A name is required' })}
        />
      </div>

      <Input
        label="Target Amount (₹)"
        type="number"
        step="0.01"
        error={errors.targetAmount?.message}
        {...register('targetAmount', {
          required: 'Target amount is required',
          min: { value: 1, message: 'Must be greater than 0' },
        })}
      />

      <Input label="Target Date (optional)" type="date" {...register('targetDate')} />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}

export default GoalForm;
