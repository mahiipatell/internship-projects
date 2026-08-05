import { useState } from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function SecurityTab() {
  const { user, firebaseUser, isEmailVerified, resendVerification, resetPassword, logout } = useAuth();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    await resetPassword(user.email);
    setMessage('Password reset email sent — check your inbox.');
  };

  const handleResendVerification = async () => {
    await resendVerification();
    setMessage('Verification email sent — check your inbox.');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isGoogleAccount = firebaseUser?.providerData?.some((p) => p.providerId === 'google.com');

  return (
    <div className="space-y-6">
      <Card title="Security">
        {message && (
          <div className="mb-4 text-sm text-primary-700 bg-primary-100 rounded-xl px-4 py-2.5">{message}</div>
        )}

        <div className="flex items-center justify-between py-3 border-b border-olive-900/5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className={isEmailVerified ? 'text-income' : 'text-primary-600'} />
            <span className="text-sm text-olive-900">Email verification</span>
          </div>
          {isEmailVerified ? (
            <span className="text-xs font-medium text-income">Verified</span>
          ) : (
            <Button variant="secondary" onClick={handleResendVerification}>Resend Email</Button>
          )}
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-olive-900">Password</span>
          {isGoogleAccount ? (
            <span className="text-xs text-olive-600/60">Managed by Google Sign-In</span>
          ) : (
            <Button variant="secondary" onClick={handleResetPassword}>Send Reset Email</Button>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-olive-900">Log out</p>
            <p className="text-xs text-olive-600/60">End your current session on this device.</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default SecurityTab;
