import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Browse from './pages/Browse';
import Search from './pages/Search';
import Details from './pages/Details';
import Person from './pages/Person';
import Watchlist from './pages/Watchlist';
import Favorites from './pages/Favorites';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-marquee-bg">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          <Route path="/movies" element={<Browse mediaType="movie" listType="popular" title="Movies" />} />
          <Route path="/tv" element={<Browse mediaType="tv" listType="popular" title="TV Shows" />} />
          <Route path="/trending" element={<Browse mediaType="all" listType="trending" title="Trending Now" />} />
          <Route path="/top-rated" element={<Browse mediaType="movie" listType="top-rated" title="Top Rated Movies" />} />
          <Route path="/upcoming" element={<Browse mediaType="movie" listType="upcoming" title="Upcoming Releases" />} />

          <Route path="/search" element={<Search />} />
          <Route path="/:mediaType/:id" element={<Details />} />
          <Route path="/person/:id" element={<Person />} />

          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
