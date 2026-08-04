import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/user.service';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm();

  const onProfileSubmit = async (data) => {
    setProfileMessage('');
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile(data);
      updateUser(updated);
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordMessage('');
    setSavingPassword(true);
    try {
      await userService.changePassword(data);
      setPasswordMessage('Password changed successfully.');
      passwordForm.reset();
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Profile</h1>
        <p className="text-sm text-olive-600/70">Manage your account details.</p>
      </div>

      <Card title="Edit Profile">
        {profileMessage && (
          <div className="mb-4 text-sm text-primary-700 bg-primary-100 rounded-lg px-3 py-2">
            {profileMessage}
          </div>
        )}
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <Input
            label="Full name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            type="email"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email', { required: 'Email is required' })}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Change Password">
        {passwordMessage && (
          <div className="mb-4 text-sm text-primary-700 bg-primary-100 rounded-lg px-3 py-2">
            {passwordMessage}
          </div>
        )}
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
          />
          <Input
            label="New password"
            type="password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register('newPassword', {
              required: 'New password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-olive-900 dark:text-gray-100">Log out</p>
            <p className="text-xs text-olive-600/70">End your current session on this device.</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Profile;
