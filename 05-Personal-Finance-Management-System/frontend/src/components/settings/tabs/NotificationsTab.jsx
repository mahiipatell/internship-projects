import { useState } from 'react';
import Card from '../../ui/Card';

const TOGGLES = [
  { key: 'budgetAlerts', label: 'Budget limit alerts', description: 'When an allocation is near or over budget' },
  { key: 'recurringReminders', label: 'Recurring transaction reminders', description: 'Before rent, subscriptions, or bills are due' },
  { key: 'weeklySummary', label: 'Weekly spending summary', description: 'A recap of your week every Monday' },
  { key: 'goalMilestones', label: 'Savings goal milestones', description: 'When a savings goal hits 25/50/75/100%' },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-primary-500' : 'bg-olive-900/10'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function NotificationsTab() {
  // Notifications infrastructure (push/email delivery) isn't built yet —
  // these preferences are stored locally for now so the settings surface
  // exists and is ready to wire up to a real notification service later.
  const [prefs, setPrefs] = useState({
    budgetAlerts: true,
    recurringReminders: true,
    weeklySummary: false,
    goalMilestones: true,
  });

  return (
    <Card title="Notifications" subtitle="Choose what you'd like to be notified about.">
      <div className="text-xs text-olive-600/60 bg-cream rounded-xl px-4 py-2.5 mb-4">
        Notification delivery isn't wired up yet — these preferences are saved for when it is.
      </div>
      <div className="divide-y divide-olive-900/5">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-olive-900">{t.label}</p>
              <p className="text-xs text-olive-600/60">{t.description}</p>
            </div>
            <Toggle checked={prefs[t.key]} onChange={(v) => setPrefs((p) => ({ ...p, [t.key]: v }))} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default NotificationsTab;
