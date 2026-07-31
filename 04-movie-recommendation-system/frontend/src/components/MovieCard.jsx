import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaStar, FaPlay, FaPlus, FaCheck, FaHeart, FaRegHeart } from 'react-icons/fa';
import { tmdbImage } from '../services/api';
import { watchlistService, favoritesService } from '../services/movies.service';
import { useAuth } from '../context/AuthContext';

// Renders a single poster card, Netflix-row style: the poster is the whole
// card (no title/year printed underneath it), and on hover it scales up
// slightly above its neighbors with a title/rating overlay — same pattern
// Netflix uses for its browse rows.
//
// object-contain (not object-cover) is used deliberately so the ENTIRE
// poster is always visible with no cropping, even if a title's poster
// doesn't match the standard 2:3 TMDB ratio exactly.
//
// The hover overlay also exposes quick actions (Watchlist / Favorite) so
// users don't have to open the details page just to save a title. Since
// list endpoints (trending/popular/search/etc.) don't tell us whether a
// title is already saved, these buttons track their own optimistic local
// state per-card; the details page remains the source of truth for the
// authoritative saved/favorited state.
export default function MovieCard({ item, mediaTypeOverride, className = 'w-full' }) {
  const { isAuthenticated } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [busy, setBusy] = useState(false);

  const mediaType = mediaTypeOverride || item.media_type || (item.title ? 'movie' : 'tv');
  if (mediaType === 'person') return null; // people are rendered by PersonCard elsewhere

  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const year = date ? new Date(date).getFullYear() : null;
  const poster = tmdbImage(item.poster_path, 'w342');

  const buildPayload = () => ({
    tmdbId: item.id,
    mediaType,
    title,
    posterPath: item.poster_path,
    releaseDate: date,
    voteAverage: item.vote_average,
    genreIds: item.genre_ids || [],
  });

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to do that.');
      return false;
    }
    return true;
  };

  const handleWatchlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth() || busy) return;
    setBusy(true);
    try {
      if (inWatchlist) {
        await watchlistService.remove(item.id, mediaType);
        setInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        await watchlistService.add(buildPayload());
        setInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth() || busy) return;
    setBusy(true);
    try {
      if (inFavorites) {
        await favoritesService.remove(item.id, mediaType);
        setInFavorites(false);
        toast.success('Removed from favorites');
      } else {
        await favoritesService.add(buildPayload());
        setInFavorites(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`group relative z-0 hover:z-20 ${className}`}
    >
      <Link to={`/${mediaType}/${item.id}`} className="block">
        <div className="relative aspect-[2/3] rounded overflow-hidden bg-black border border-marquee-border group-hover:border-marquee-text/40 group-hover:shadow-glow transition-colors">
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="h-full w-full object-contain bg-black"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-center text-xs text-marquee-muted p-2 bg-marquee-surface">
              {title}
            </div>
          )}

          {/* Hover overlay: quick actions + title, year/type, rating */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 pt-8">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white text-black">
                <FaPlay className="text-[9px] ml-0.5" />
              </span>
              <button
                type="button"
                onClick={handleWatchlistClick}
                aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                className="flex items-center justify-center h-6 w-6 rounded-full border border-white/60 text-white hover:border-white transition-colors disabled:opacity-50"
                disabled={busy}
              >
                {inWatchlist ? <FaCheck className="text-[9px]" /> : <FaPlus className="text-[9px]" />}
              </button>
              <button
                type="button"
                onClick={handleFavoriteClick}
                aria-label={inFavorites ? 'Remove from favorites' : 'Add to favorites'}
                title={inFavorites ? 'Remove from favorites' : 'Add to favorites'}
                className="flex items-center justify-center h-6 w-6 rounded-full border border-white/60 text-white hover:border-marquee-gold transition-colors disabled:opacity-50"
                disabled={busy}
              >
                {inFavorites ? <FaHeart className="text-[9px] text-marquee-gold" /> : <FaRegHeart className="text-[9px]" />}
              </button>
              {item.vote_average > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-marquee-gold ml-auto">
                  <FaStar className="text-[10px]" />
                  {item.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="text-xs font-semibold text-white leading-tight line-clamp-2">{title}</h3>
            <p className="text-[10px] text-marquee-muted mt-0.5">
              {year || '—'} · {mediaType === 'tv' ? 'TV Series' : 'Movie'}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
