import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieGrid from '../components/MovieGrid';
import GenreFilterBar from '../components/GenreFilterBar';
import { moviesService } from '../services/movies.service';

// listType: 'popular' | 'top-rated' | 'trending' | 'upcoming'
export default function Browse({ mediaType, listType, title }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genreId, setGenreId] = useState(searchParams.get('genre') || null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mediaType === 'all') return;
    moviesService.genres(mediaType).then((d) => setGenres(d.genres || []));
  }, [mediaType]);

  const fetchList = useCallback(
    async (pageNum, gId) => {
      setLoading(true);
      try {
        let data;
        if (gId) {
          data = await moviesService.byGenre(gId, mediaType, pageNum);
        } else if (listType === 'top-rated') {
          data = await moviesService.topRated(mediaType, pageNum);
        } else if (listType === 'trending') {
          data = await moviesService.trending(mediaType, 'week', pageNum);
        } else if (listType === 'upcoming') {
          data = await moviesService.upcoming(pageNum);
        } else {
          data = await moviesService.popular(mediaType, pageNum);
        }
        setItems(data.results || []);
        setTotalPages(Math.min(data.total_pages || 1, 500));
      } finally {
        setLoading(false);
      }
    },
    [mediaType, listType]
  );

  useEffect(() => {
    fetchList(page, genreId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, genreId, fetchList]);

  const handleGenreSelect = (id) => {
    const newId = String(id) === String(genreId) ? null : id;
    setGenreId(newId);
    setPage(1);
    setSearchParams(newId ? { genre: newId } : {});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <h1 className="font-display text-4xl tracking-wide mb-4">{title}</h1>
      {genres.length > 0 && (
        <div className="mb-6">
          <GenreFilterBar genres={genres} activeId={genreId} onSelect={handleGenreSelect} />
        </div>
      )}

      <MovieGrid items={items} mediaTypeOverride={mediaType} loading={loading} />

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-md border border-marquee-border text-sm disabled:opacity-40 hover:border-marquee-gold hover:text-marquee-gold transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-marquee-muted">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-md border border-marquee-border text-sm disabled:opacity-40 hover:border-marquee-gold hover:text-marquee-gold transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
