import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import Card from '../../ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import userService from '../../../services/user.service';

function AppearanceTab() {
  const { user, updateProfile } = useAuth();
  const [theme, setTheme] = useState(user?.theme || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const selectTheme = async (value) => {
    setTheme(value);
    const updated = await userService.updateProfile({ theme: value });
    updateProfile(updated);
  };

  return (
    <Card title="Appearance" subtitle="Choose how Expense Tracker looks on this device.">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => selectTheme('light')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            theme === 'light' ? 'border-primary-500 bg-primary-50 shadow-soft' : 'border-olive-900/10 bg-white'
          }`}
        >
          <Sun size={20} className="text-primary-600 mb-2" />
          <p className="font-semibold text-sm text-olive-900">Light</p>
          <p className="text-xs text-olive-600/60">Warm white & butter yellow</p>
        </button>
        <button
          onClick={() => selectTheme('dark')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            theme === 'dark' ? 'border-primary-500 bg-primary-50 shadow-soft' : 'border-olive-900/10 bg-white'
          }`}
        >
          <Moon size={20} className="text-primary-600 mb-2" />
          <p className="font-semibold text-sm text-olive-900">Dark</p>
          <p className="text-xs text-olive-600/60">Easier on the eyes at night</p>
        </button>
      </div>
    </Card>
  );
}

export default AppearanceTab;
