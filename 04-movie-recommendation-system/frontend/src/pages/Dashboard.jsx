import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaBookmark, FaHeart, FaStar, FaHistory, FaTrash } from 'react-icons/fa';
import { userService } from '../services/auth.service';
import {
  watchlistService,
  favoritesService,
  historyService,
  recommendationsService,
} from '../services/movies.service';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MovieRow from '../components/MovieRow';
import Loader from '../components/Loader';
import { tmdbImage } from '../services/api';

function normalize(item) {
  return {
    id: item.tmdbId,
    media_type: item.mediaType.toLowerCase(),
    title: item.title,
    name: item.title,
    poster_path: item.posterPath,
    release_date: item.releaseDate,
    first_air_date: item.releaseDate,
    vote_average: item.voteAverage,
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsData, wl, fav, hist, rec] = await Promise.all([
        userService.getStats(),
        watchlistService.list(),
        favoritesService.list(),
        historyService.list(),
        recommendationsService.get('movie'),
      ]);
      setStats(statsData.stats);
      setWatchlist(wl.items || []);
      setFavorites(fav.items || []);
      setHistory(hist.items || []);
      setRecommendations(rec.results || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClearHistory = async () => {
    try {
      await historyService.clear();
      setHistory([]);
      toast.success('Watch history cleared');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <h1 className="font-display text-4xl tracking-wide mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <p className="text-marquee-muted text-sm mb-8">Here's what's happening with your CineMatch account.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <StatCard label="Watchlist" value={stats?.watchlistCount ?? 0} icon={FaBookmark} />
        <StatCard label="Favorites" value={stats?.favoritesCount ?? 0} icon={FaHeart} accent="crimson" />
        <StatCard label="Rated Titles" value={stats?.ratingsCount ?? 0} icon={FaStar} />
        <StatCard label="Watched" value={stats?.historyCount ?? 0} icon={FaHistory} />
        <StatCard label="Avg. Rating Given" value={stats?.averageRatingGiven ?? 0} icon={FaStar} />
      </div>

      <MovieRow
        title="Recommended For You"
        items={recommendations}
        mediaTypeOverride="movie"
        emptyMessage="Rate a few titles or add favorites to unlock personalized picks."
      />

      <MovieRow
        title="Your Watchlist"
        items={watchlist.slice(0, 12).map(normalize)}
        emptyMessage="Nothing saved yet. Browse titles and tap Watchlist to add them here."
      />

      <MovieRow
        title="Your Favorites"
        items={favorites.slice(0, 12).map(normalize)}
        emptyMessage="No favorites yet. Mark titles you love from their details page."
      />

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-display text-2xl md:text-3xl tracking-wide text-marquee-text">Watch History</h2>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs text-marquee-muted hover:text-marquee-crimson transition-colors"
            >
              <FaTrash /> Clear History
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-marquee-muted text-sm px-1">Titles you mark as watched or rate will show up here.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
            {history.slice(0, 15).map((h) => (
              <Link key={h.id} to={`/${h.mediaType.toLowerCase()}/${h.tmdbId}`} className="shrink-0 w-[140px] group">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-marquee-surface border border-marquee-border group-hover:border-marquee-gold transition-colors">
                  {h.posterPath ? (
                    <img src={tmdbImage(h.posterPath, 'w342')} alt={h.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-marquee-muted p-2 text-center">{h.title}</div>
                  )}
                </div>
                <p className="text-xs mt-2 truncate">{h.title}</p>
                <p className="text-[11px] text-marquee-muted">{new Date(h.watchedAt).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
