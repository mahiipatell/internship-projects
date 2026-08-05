import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Card from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import userService from '../../../services/user.service';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatar_url || '',
      currency: user?.currency || 'INR',
      monthlyIncome: user?.monthly_income || '',
      country: user?.country || '',
      timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const onSubmit = async (data) => {
    setMessage('');
    setSubmitting(true);
    try {
      const updated = await userService.updateProfile({
        ...data,
        monthlyIncome: data.monthlyIncome ? Number(data.monthlyIncome) : null,
      });
      updateProfile(updated);
      setMessage('Profile updated successfully.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Profile">
      {message && (
        <div className="mb-4 text-sm text-primary-700 bg-primary-100 rounded-xl px-4 py-2.5">{message}</div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-200 text-olive-900 flex items-center justify-center text-2xl font-semibold overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1">
            <Input label="Profile Picture URL" placeholder="https://..." {...register('avatarUrl')} />
          </div>
        </div>

        <Input label="Full name" {...register('name', { required: true })} />
        <p className="text-xs text-olive-600/60 -mt-2">
          Email: {user?.email} {user?.email_verified ? '✓ Verified' : '(unverified)'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Preferred Currency" {...register('currency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Input label="Monthly Income" type="number" step="0.01" {...register('monthlyIncome')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Country" placeholder="e.g. India" {...register('country')} />
          <Input label="Time Zone" placeholder="e.g. Asia/Kolkata" {...register('timezone')} />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Card>
  );
}

export default ProfileTab;
