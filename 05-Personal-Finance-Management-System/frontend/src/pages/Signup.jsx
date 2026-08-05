import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async ({ name, email, password }) => {
    setServerError('');
    setSubmitting(true);
    try {
      await signup({ name, email, password, rememberMe: true });
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setServerError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(true);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-olive-900 dark:text-gray-100 mb-1">
        Create your account
      </h1>
      <p className="text-sm text-olive-600/70 mb-6">Start tracking your income and expenses.</p>

      {serverError && (
        <div className="mb-4 text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">
          {serverError}
        </div>
      )}

      <Button type="button" variant="secondary" className="w-full mb-4" onClick={handleGoogle} disabled={googleLoading}>
        {googleLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-olive-900/10" />
        <span className="text-xs text-olive-600/50">or</span>
        <div className="flex-1 h-px bg-olive-900/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          })}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <p className="text-sm text-olive-600/70 text-center mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default Signup;
