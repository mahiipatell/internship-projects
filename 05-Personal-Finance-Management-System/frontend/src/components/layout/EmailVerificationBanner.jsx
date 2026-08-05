import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

function EmailVerificationBanner() {
  const { isEmailVerified, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    await resendVerification();
    setSent(true);
  };

  return (
    <div className="bg-primary-100 border-b border-primary-200/60 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-olive-900">
          <Mail size={15} />
          {sent
            ? "Verification email sent — check your inbox."
            : 'Please verify your email to keep your account secure.'}
        </div>
        <div className="flex items-center gap-3">
          {!sent && (
            <button onClick={handleResend} className="font-medium text-primary-700 hover:underline">
              Resend email
            </button>
          )}
          <button onClick={() => setDismissed(true)} className="text-olive-600/60 hover:text-olive-900">
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationBanner;
