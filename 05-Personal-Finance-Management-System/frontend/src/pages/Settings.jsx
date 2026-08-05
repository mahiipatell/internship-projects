import { useState } from 'react';
import { User, Wallet, ShieldCheck, Bell, Palette, Upload, Download, Link2 } from 'lucide-react';
import ProfileTab from '../components/settings/tabs/ProfileTab';
import AccountTab from '../components/settings/tabs/AccountTab';
import SecurityTab from '../components/settings/tabs/SecurityTab';
import NotificationsTab from '../components/settings/tabs/NotificationsTab';
import AppearanceTab from '../components/settings/tabs/AppearanceTab';
import ImportCenterTab from '../components/settings/tabs/ImportCenterTab';
import ExportDataTab from '../components/settings/tabs/ExportDataTab';
import ConnectedAccountsTab from '../components/settings/tabs/ConnectedAccountsTab';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User, Component: ProfileTab },
  { id: 'account', label: 'Account', icon: Wallet, Component: AccountTab },
  { id: 'security', label: 'Security', icon: ShieldCheck, Component: SecurityTab },
  { id: 'notifications', label: 'Notifications', icon: Bell, Component: NotificationsTab },
  { id: 'appearance', label: 'Appearance', icon: Palette, Component: AppearanceTab },
  { id: 'import', label: 'Import Center', icon: Upload, Component: ImportCenterTab },
  { id: 'export', label: 'Export Data', icon: Download, Component: ExportDataTab },
  { id: 'connected', label: 'Connected Accounts', icon: Link2, Component: ConnectedAccountsTab },
];

function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-olive-600/70">Manage your profile, accounts, and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:w-56 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${
                  activeTab === id
                    ? 'bg-primary-100 text-olive-900 shadow-soft'
                    : 'text-olive-600 hover:bg-white'
                }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">{ActiveComponent && <ActiveComponent />}</div>
      </div>
    </div>
  );
}

export default Settings;
