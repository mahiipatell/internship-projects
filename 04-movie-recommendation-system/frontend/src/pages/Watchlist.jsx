import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBookmark } from 'react-icons/fa';
import { watchlistService } from '../services/movies.service';
import MovieGrid from '../components/MovieGrid';
import Loader from '../components/Loader';

// DB rows store fields like tmdbId/mediaType/posterPath; normalize them into
// the shape MovieCard/MovieGrid expect (id/media_type/poster_path/vote_average).
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

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    watchlistService
      .list()
      .then((data) => setItems(data.items || []))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <h1 className="font-display text-4xl tracking-wide mb-1">My Watchlist</h1>
      <p className="text-marquee-muted text-sm mb-8">{items.length} titles saved to watch later</p>

      {loading ? (
        <Loader />
      ) : (
        <MovieGrid
          items={items.map(normalize)}
          emptyTitle="Your watchlist is empty"
          emptyMessage="Save movies and shows you want to watch later by clicking the Watchlist button on any title."
        />
      )}
    </div>
  );
}
