import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-olive-900 dark:text-gray-100 mb-1">Welcome back</h1>
      <p className="text-sm text-olive-600/70 mb-6">Log in to continue tracking your expenses.</p>

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
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <p className="text-sm text-olive-600/70 text-center mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-primary-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default Login;
