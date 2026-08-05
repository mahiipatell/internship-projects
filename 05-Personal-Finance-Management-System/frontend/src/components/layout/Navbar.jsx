import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 lg:px-8 bg-cream/80 dark:bg-gray-900/80 backdrop-blur border-b border-olive-900/5 dark:border-gray-800">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800"
      >
        <Menu size={20} />
      </button>

      <div className="hidden lg:block" />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-200 text-olive-900 flex items-center justify-center font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-olive-700 dark:text-gray-200">
            {user?.name}
          </span>
          <ChevronDown size={16} className="text-olive-600/60" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lift border border-olive-900/5 dark:border-gray-800 py-1 animate-in">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-olive-700 dark:text-gray-200 hover:bg-cream dark:hover:bg-gray-800"
            >
              <User size={16} /> Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-expense hover:bg-expense/10"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
