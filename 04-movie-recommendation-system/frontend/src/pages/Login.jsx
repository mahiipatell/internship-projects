import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaFilm } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-spotlight bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <FaFilm className="text-marquee-gold text-3xl mb-2" />
          <h1 className="font-display text-3xl tracking-widest">WELCOME BACK</h1>
          <p className="text-marquee-muted text-sm mt-1">Log in to continue your watchlist</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-marquee-surface/60 backdrop-blur-xl border border-white/10 rounded-xl p-8 space-y-4 shadow-2xl">
          <div>
            <label className="block text-sm font-medium text-marquee-muted mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marquee-muted mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marquee-gold text-marquee-bg font-semibold py-2.5 rounded-md hover:bg-marquee-goldMuted transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-marquee-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-marquee-gold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
