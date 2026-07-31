import { useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import MovieCard from './MovieCard';
import PersonCard from './PersonCard';

// A titled, horizontally-scrollable row of poster cards — the core building
// block of the Netflix/IMDb-style browse experience (Trending, Popular, etc).
export default function MovieRow({ title, items = [], loading, mediaTypeOverride, emptyMessage }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 640, behavior: 'smooth' });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-display text-2xl md:text-3xl tracking-wide text-marquee-text">{title}</h2>
        <div className="hidden sm:flex gap-2">
          <button
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll(-1)}
            className="h-8 w-8 rounded-full border border-marquee-border flex items-center justify-center text-marquee-muted hover:text-marquee-gold hover:border-marquee-gold transition-colors"
          >
            <FaChevronLeft className="text-xs" />
          </button>
          <button
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll(1)}
            className="h-8 w-8 rounded-full border border-marquee-border flex items-center justify-center text-marquee-muted hover:text-marquee-gold hover:border-marquee-gold transition-colors"
          >
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[150px] sm:w-[170px] shrink-0 animate-pulse">
              <div className="aspect-[2/3] rounded bg-marquee-surface" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-marquee-muted text-sm px-1">{emptyMessage || 'Nothing to show yet.'}</p>
      ) : (
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto overflow-y-visible no-scrollbar py-3 px-1 scroll-smooth">
          {items.map((item) =>
            item.media_type === 'person' ? (
              <PersonCard key={`p-${item.id}`} person={item} />
            ) : (
              <MovieCard
                key={`${item.media_type || mediaTypeOverride}-${item.id}`}
                item={item}
                mediaTypeOverride={mediaTypeOverride}
                className="shrink-0 w-[150px] sm:w-[170px]"
              />
            )
          )}
        </div>
      )}
    </section>
  );
}
