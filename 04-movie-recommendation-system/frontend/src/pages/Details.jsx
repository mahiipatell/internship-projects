import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaPlay,
  FaPlus,
  FaCheck,
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaStar,
  FaClock,
} from 'react-icons/fa';
import { moviesService, watchlistService, favoritesService, ratingsService, historyService } from '../services/movies.service';
import { tmdbImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MovieRow from '../components/MovieRow';
import RatingStars from '../components/RatingStars';
import TrailerModal from '../components/TrailerModal';
import Loader from '../components/Loader';
import NotFound from './NotFound';

export default function Details() {
  const { mediaType, id } = useParams();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const validMediaType = mediaType === 'movie' || mediaType === 'tv';

  const fetchDetails = useCallback(async () => {
    if (!validMediaType) return;
    setLoading(true);
    try {
      const result = await moviesService.details(mediaType, id);
      setData(result);
      setInWatchlist(!!result.personal?.inWatchlist);
      setInFavorites(!!result.personal?.inFavorites);
      setUserRating(result.personal?.userRating || 0);
    } catch (err) {
      toast.error('Could not load details for this title.');
    } finally {
      setLoading(false);
    }
  }, [mediaType, id, validMediaType]);

  useEffect(() => {
    fetchDetails();
    window.scrollTo(0, 0);
  }, [fetchDetails]);

  if (!validMediaType) return <NotFound />;
  if (loading) return <Loader fullScreen />;
  if (!data) return null;

  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').slice(0, 4);
  const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]);
  const backdrop = tmdbImage(data.backdrop_path, 'original');
  const poster = tmdbImage(data.poster_path, 'w500');
  const trailer = (data.videos?.results || []).find((v) => v.type === 'Trailer' && v.site === 'YouTube');
  const director = (data.credits?.crew || []).find((c) => c.job === 'Director');
  const writers = (data.credits?.crew || []).filter((c) => ['Writer', 'Screenplay'].includes(c.job)).slice(0, 2);
  const cast = (data.credits?.cast || []).slice(0, 12);
  const reviews = (data.reviews?.results || []).slice(0, 3);
  const buildBasePayload = () => ({
    tmdbId: data.id,
    mediaType,
    title,
    posterPath: data.poster_path,
    releaseDate: data.release_date || data.first_air_date,
    voteAverage: data.vote_average,
    genreIds: (data.genres || []).map((g) => g.id),
  });

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to do that.');
      return false;
    }
    return true;
  };

  const toggleWatchlist = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      if (inWatchlist) {
        await watchlistService.remove(data.id, mediaType);
        setInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        await watchlistService.add(buildBasePayload());
        setInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFavorite = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      if (inFavorites) {
        await favoritesService.remove(data.id, mediaType);
        setInFavorites(false);
        toast.success('Removed from favorites');
      } else {
        await favoritesService.add(buildBasePayload());
        setInFavorites(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (score) => {
    if (!requireAuth()) return;
    setUserRating(score); // optimistic
    try {
      await ratingsService.rate({ ...buildBasePayload(), score });
      toast.success(`Rated ${score}/10`);
      // A rating is a strong "I watched this" signal — log it to history too.
      await historyService.add(buildBasePayload());
    } catch (err) {
      toast.error(err.message);
    }
  };

  const markAsWatched = async () => {
    if (!requireAuth()) return;
    try {
      await historyService.add(buildBasePayload());
      toast.success('Added to watch history');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        {backdrop && <img src={backdrop} alt={title} className="absolute inset-0 h-full w-full object-cover object-top" />}
        <div className="absolute inset-0 bg-gradient-to-t from-marquee-bg via-marquee-bg/70 to-marquee-bg/30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-48 relative z-10 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row gap-8">
          <div className="w-48 sm:w-64 shrink-0 mx-auto md:mx-0">
            <div className="rounded-lg overflow-hidden border border-marquee-border shadow-glow">
              {poster ? (
                <img src={poster} alt={title} className="w-full" />
              ) : (
                <div className="aspect-[2/3] bg-marquee-surface flex items-center justify-center text-marquee-muted text-sm p-4 text-center">{title}</div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-shadow-marquee">{title}</h1>
            {data.tagline && <p className="text-marquee-gold italic mt-1">{data.tagline}</p>}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-marquee-muted">
              {data.vote_average > 0 && (
                <span className="flex items-center gap-1.5 text-marquee-gold font-semibold text-base">
                  <FaStar /> {data.vote_average.toFixed(1)}
                  <span className="text-marquee-muted font-normal text-xs">({data.vote_count} votes)</span>
                </span>
              )}
              {year && <span>{year}</span>}
              {runtime && (
                <span className="flex items-center gap-1">
                  <FaClock className="text-xs" /> {runtime} min
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {(data.genres || []).map((g) => (
                <Link
                  key={g.id}
                  to={`/${mediaType === 'tv' ? 'tv' : 'movies'}?genre=${g.id}`}
                  className="text-xs px-3 py-1 rounded-full border border-marquee-border text-marquee-muted hover:border-marquee-gold hover:text-marquee-gold transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            <p className="mt-5 text-marquee-text/90 leading-relaxed max-w-3xl">{data.overview}</p>

            <div className="mt-5 text-sm text-marquee-muted space-y-1">
              {director && <p><span className="text-marquee-text font-medium">Director:</span> {director.name}</p>}
              {writers.length > 0 && <p><span className="text-marquee-text font-medium">Writers:</span> {writers.map((w) => w.name).join(', ')}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              {trailer && (
                <button
                  onClick={() => setTrailerKey(trailer.key)}
                  className="flex items-center gap-2 bg-marquee-gold text-marquee-bg font-semibold px-5 py-2.5 rounded-md hover:bg-marquee-goldMuted transition-colors"
                >
                  <FaPlay /> Watch Trailer
                </button>
              )}
              <button
                onClick={toggleWatchlist}
                disabled={busy}
                className="flex items-center gap-2 border border-marquee-border px-4 py-2.5 rounded-md hover:border-marquee-gold hover:text-marquee-gold transition-colors text-sm font-medium"
              >
                {inWatchlist ? <FaCheck /> : <FaPlus />} {inWatchlist ? 'In Watchlist' : 'Watchlist'}
              </button>
              <button
                onClick={toggleFavorite}
                disabled={busy}
                className="flex items-center gap-2 border border-marquee-border px-4 py-2.5 rounded-md hover:border-marquee-crimson hover:text-marquee-crimson transition-colors text-sm font-medium"
              >
                {inFavorites ? <FaHeart className="text-marquee-crimson" /> : <FaRegHeart />} Favorite
              </button>
              <button
                onClick={markAsWatched}
                className="flex items-center gap-2 border border-marquee-border px-4 py-2.5 rounded-md hover:border-marquee-gold hover:text-marquee-gold transition-colors text-sm font-medium"
              >
                <FaRegBookmark /> Mark Watched
              </button>
            </div>

            <div className="mt-6 bg-marquee-surface border border-marquee-border rounded-lg p-4 inline-block">
              <p className="text-xs text-marquee-muted uppercase tracking-wide mb-2">Your Rating</p>
              <RatingStars value={userRating} onChange={handleRate} />
            </div>
          </div>
        </motion.div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl tracking-wide mb-4">Cast</h2>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
              {cast.map((c) => (
                <Link key={c.id} to={`/person/${c.id}`} className="shrink-0 w-28 text-center group">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto bg-marquee-surface border border-marquee-border group-hover:border-marquee-gold transition-colors">
                    {c.profile_path ? (
                      <img src={tmdbImage(c.profile_path, 'w185')} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-marquee-muted">{c.name}</div>
                    )}
                  </div>
                  <p className="text-xs font-medium mt-2 truncate">{c.name}</p>
                  <p className="text-[11px] text-marquee-muted truncate">{c.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl tracking-wide mb-4">Reviews</h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-marquee-surface border border-marquee-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-marquee-gold">{r.author}</span>
                    {r.author_details?.rating && (
                      <span className="flex items-center gap-1 text-xs text-marquee-muted">
                        <FaStar className="text-marquee-gold" /> {r.author_details.rating}/10
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-marquee-text/85 line-clamp-5">{r.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar / Recommendations from TMDB */}
        <div className="mt-14">
          <MovieRow
            title="More Like This"
            items={data.recommendations?.results?.length ? data.recommendations.results : data.similar?.results || []}
            mediaTypeOverride={mediaType}
          />
        </div>
      </div>

      <TrailerModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
    </div>
  );
}
