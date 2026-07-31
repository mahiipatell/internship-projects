export default function GenreFilterBar({ genres = [], activeId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {genres.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            String(activeId) === String(g.id)
              ? 'bg-marquee-gold text-marquee-bg border-marquee-gold'
              : 'border-marquee-border text-marquee-muted hover:text-marquee-gold hover:border-marquee-gold'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
