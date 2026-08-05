import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { rememberMe: true } });

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      await login(data);
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
      <h1 className="text-xl font-semibold text-olive-900 dark:text-gray-100 mb-1">Welcome back</h1>
      <p className="text-sm text-olive-600/70 mb-6">Log in to continue tracking your finances.</p>

      {serverError && (
        <div className="mb-4 text-sm text-expense bg-expense/10 rounded-lg px-3 py-2">
          {serverError}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className="w-full mb-4"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        <GoogleIcon /> {googleLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-olive-900/10" />
        <span className="text-xs text-olive-600/50">or</span>
        <div className="flex-1 h-px bg-olive-900/10" />
      </div>

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
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-olive-600/70">
            <input
              type="checkbox"
              className="rounded border-olive-900/20 text-primary-600 focus:ring-primary-400"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-600 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>
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
