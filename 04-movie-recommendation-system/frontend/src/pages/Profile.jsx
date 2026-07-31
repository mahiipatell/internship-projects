import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserCircle } from 'react-icons/fa';
import { userService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { user: updated } = await userService.updateProfile(profileForm);
      updateUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await userService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userService.deleteAccount();
      toast.success('Account deleted');
      await logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      <div className="flex items-center gap-4 mb-10">
        {profileForm.avatarUrl ? (
          <img src={profileForm.avatarUrl} alt={user?.name} className="h-16 w-16 rounded-full object-cover border border-marquee-border" />
        ) : (
          <FaUserCircle className="text-6xl text-marquee-muted" />
        )}
        <div>
          <h1 className="font-display text-3xl tracking-wide">{user?.name}</h1>
          <p className="text-marquee-muted text-sm">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="bg-marquee-surface border border-marquee-border rounded-lg p-6 space-y-4 mb-8">
        <h2 className="font-display text-xl tracking-wide mb-2">Profile Details</h2>
        <div>
          <label className="block text-sm font-medium text-marquee-muted mb-1">Name</label>
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-marquee-muted mb-1">Avatar URL</label>
          <input
            type="url"
            value={profileForm.avatarUrl}
            onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
            placeholder="https://…"
            className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-marquee-muted mb-1">Bio</label>
          <textarea
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            maxLength={300}
            rows={3}
            className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={savingProfile}
          className="bg-marquee-gold text-marquee-bg font-semibold px-5 py-2.5 rounded-md hover:bg-marquee-goldMuted transition-colors disabled:opacity-60"
        >
          {savingProfile ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-marquee-surface border border-marquee-border rounded-lg p-6 space-y-4 mb-8">
        <h2 className="font-display text-xl tracking-wide mb-2">Change Password</h2>
        <div>
          <label className="block text-sm font-medium text-marquee-muted mb-1">Current Password</label>
          <input
            type="password"
            required
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-marquee-muted mb-1">New Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="w-full bg-marquee-bg border border-marquee-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-marquee-gold"
          />
        </div>
        <button
          type="submit"
          disabled={savingPassword}
          className="bg-marquee-gold text-marquee-bg font-semibold px-5 py-2.5 rounded-md hover:bg-marquee-goldMuted transition-colors disabled:opacity-60"
        >
          {savingPassword ? 'Updating…' : 'Update Password'}
        </button>
      </form>

      <div className="border border-marquee-crimson/40 rounded-lg p-6 bg-marquee-crimson/5">
        <h2 className="font-display text-xl tracking-wide mb-2 text-marquee-crimson">Danger Zone</h2>
        <p className="text-sm text-marquee-muted mb-4">
          Deleting your account permanently removes your watchlist, favorites, ratings, and watch history. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="border border-marquee-crimson text-marquee-crimson px-5 py-2.5 rounded-md text-sm font-medium hover:bg-marquee-crimson hover:text-marquee-text transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleDeleteAccount}
              className="bg-marquee-crimson text-marquee-text px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Confirm Permanent Deletion
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="border border-marquee-border px-5 py-2.5 rounded-md text-sm font-medium hover:border-marquee-text transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
