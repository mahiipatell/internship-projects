import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setServerError('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">📧</div>
        <h1 className="text-xl font-semibold text-olive-900 mb-1">Check your email</h1>
        <p className="text-sm text-olive-600/70 mb-6">
          If an account exists for that address, we've sent a link to reset your password.
        </p>
        <Link to="/login" className="text-primary-600 font-medium hover:underline text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-olive-900 mb-1">Reset your password</h1>
      <p className="text-sm text-olive-600/70 mb-6">
        Enter your email and we'll send you a link to reset it.
      </p>

      {serverError && (
        <div className="mb-4 text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="text-sm text-olive-600/70 text-center mt-6">
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
