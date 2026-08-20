import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['admin', 'cashier', 'waiter'] },
  { to: '/menu', label: 'Menu', roles: ['admin', 'waiter'] },
  { to: '/categories', label: 'Categories', roles: ['admin'] },
  { to: '/tables', label: 'Tables', roles: ['admin', 'waiter'] },
  { to: '/orders', label: 'Orders', roles: ['admin', 'waiter', 'cashier'] },
  { to: '/billing', label: 'Billing', roles: ['admin', 'cashier'] },
  { to: '/sales-history', label: 'Sales History', roles: ['admin', 'cashier'] },
  { to: '/reports', label: 'Reports', roles: ['admin'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
  { to: '/profile', label: 'Profile', roles: ['admin', 'cashier', 'waiter'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white md:block">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-primary-600">🍽️ RestroMS</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.filter((item) => item.roles.includes(user?.role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
