import MovieCard from './MovieCard';
import PersonCard from './PersonCard';
import EmptyState from './EmptyState';
import { FaFilm } from 'react-icons/fa';

const GRID_CLASSES = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-2 gap-y-6';

export default function MovieGrid({ items = [], mediaTypeOverride, emptyTitle, emptyMessage, loading = false }) {
  if (loading) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] rounded bg-marquee-surface" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={FaFilm}
        title={emptyTitle || 'No results found'}
        message={emptyMessage || 'Try a different search term or filter.'}
      />
    );
  }

  return (
    <div className={GRID_CLASSES}>
      {items.map((item) =>
        item.media_type === 'person' ? (
          <PersonCard key={`p-${item.id}`} person={item} />
        ) : (
          <MovieCard key={`${item.media_type || mediaTypeOverride}-${item.id}`} item={item} mediaTypeOverride={mediaTypeOverride} />
        )
      )}
    </div>
  );
}
