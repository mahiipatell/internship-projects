import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes, FaUserCircle, FaFilm } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Movies', to: '/movies' },
  { label: 'TV Shows', to: '/tv' },
  { label: 'Trending', to: '/trending' },
  { label: 'Top Rated', to: '/top-rated' },
];

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-marquee-bg/95 backdrop-blur-md border-b border-marquee-border' : 'bg-gradient-to-b from-marquee-bg/90 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <FaFilm className="text-marquee-gold text-xl" />
          <span className="font-display text-2xl text-marquee-gold">CINEMATCH</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 ml-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-marquee-muted hover:text-marquee-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto hidden sm:block">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-marquee-muted text-sm" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, shows, people…"
              className="w-full bg-marquee-surface border border-marquee-border rounded-full pl-9 pr-4 py-2 text-sm text-marquee-text placeholder:text-marquee-muted focus:border-marquee-gold outline-none transition-colors"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 text-marquee-text hover:text-marquee-gold transition-colors"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover border border-marquee-border" />
                ) : (
                  <FaUserCircle className="text-2xl" />
                )}
                <span className="hidden md:inline text-sm font-medium">{user?.name?.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-marquee-surface2 border border-marquee-border rounded-lg shadow-xl py-1 animate-fade-in">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-marquee-surface hover:text-marquee-gold">Dashboard</Link>
                  <Link to="/watchlist" className="block px-4 py-2 text-sm hover:bg-marquee-surface hover:text-marquee-gold">Watchlist</Link>
                  <Link to="/favorites" className="block px-4 py-2 text-sm hover:bg-marquee-surface hover:text-marquee-gold">Favorites</Link>
                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-marquee-surface hover:text-marquee-gold">Profile Settings</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-marquee-crimson hover:bg-marquee-surface">
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-marquee-text hover:text-marquee-gold px-3 py-2">
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-marquee-gold text-marquee-bg px-4 py-2 rounded-md hover:bg-marquee-goldMuted transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          <button className="lg:hidden text-marquee-text text-xl" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-marquee-bg border-t border-marquee-border px-4 py-4 space-y-3 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-marquee-muted text-sm" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-marquee-surface border border-marquee-border rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:border-marquee-gold"
            />
          </form>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="block text-sm font-medium text-marquee-muted hover:text-marquee-gold">
              {link.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 text-center text-sm font-medium border border-marquee-border rounded-md py-2">Log In</Link>
              <Link to="/register" className="flex-1 text-center text-sm font-semibold bg-marquee-gold text-marquee-bg rounded-md py-2">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
