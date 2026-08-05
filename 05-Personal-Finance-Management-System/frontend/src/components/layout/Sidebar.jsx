import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { to: '/transactions', label: 'Transactions', emoji: '💸' },
  { to: '/financial-plan', label: 'Monthly Financial Plan', emoji: '📅' },
  { to: '/savings-goals', label: 'Savings Goals', emoji: '🎯' },
  { to: '/recurring', label: 'Recurring', emoji: '🔁' },
  { to: '/insights', label: 'Insights', emoji: '📈' },
  { to: '/reports', label: 'Reports', emoji: '📄' },
  { to: '/settings', label: 'Settings', emoji: '⚙️' },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-olive-900/30 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-white dark:bg-gray-900
          border-r border-olive-900/5 dark:border-gray-800 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b border-olive-900/5 dark:border-gray-800">
          <span className="text-xl">💰</span>
          <span className="font-bold text-lg text-olive-900 dark:text-gray-100">
            Expense Tracker
          </span>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {links.map(({ to, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? 'bg-primary-100 text-olive-900 shadow-soft'
                    : 'text-olive-600 dark:text-gray-400 hover:bg-cream dark:hover:bg-gray-800 hover:translate-x-0.5'
                }`
              }
            >
              <span className="text-base leading-none">{emoji}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
