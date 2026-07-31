import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieGrid from '../components/MovieGrid';
import { moviesService } from '../services/movies.service';

const TYPES = [
  { key: 'multi', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV Shows' },
  { key: 'person', label: 'People' },
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [type, setType] = useState('multi');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setLoading(true);
    moviesService
      .search(query, type, 1)
      .then((data) => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [query, type]);

  // /search/movie and /search/tv (unlike /search/multi) don't include a
  // media_type field on each result, so explicitly tell MovieCard which
  // type these are instead of relying on its title/name fallback heuristic.
  const mediaTypeOverride = type === 'movie' || type === 'tv' ? type : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <h1 className="font-display text-3xl tracking-wide mb-1">
        Search Results {query && <span className="text-marquee-gold">"{query}"</span>}
      </h1>
      <p className="text-marquee-muted text-sm mb-6">{results.length} results found</p>

      <div className="flex gap-2 mb-8">
        {TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              type === t.key
                ? 'bg-marquee-gold text-marquee-bg border-marquee-gold'
                : 'border-marquee-border text-marquee-muted hover:text-marquee-gold hover:border-marquee-gold'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MovieGrid
        items={results.filter((r) => r.media_type !== 'person' || type === 'person' || type === 'multi')}
        mediaTypeOverride={mediaTypeOverride}
        loading={loading}
        emptyTitle="No results"
        emptyMessage={
          query
            ? `We couldn't find anything for "${query}". Try a different search.`
            : 'Start typing to search for movies, TV shows, and people.'
        }
      />
    </div>
  );
}
