import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <span className="text-sm text-gray-500 capitalize">{user?.role} panel</span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
        <button onClick={handleLogout} className="btn-secondary">
          Logout
        </button>
      </div>
    </header>
  );
}
