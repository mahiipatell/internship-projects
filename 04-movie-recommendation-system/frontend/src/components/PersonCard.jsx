import { Link } from 'react-router-dom';
import { tmdbImage } from '../services/api';

export default function PersonCard({ person }) {
  const photo = tmdbImage(person.profile_path, 'w185');
  const knownFor = (person.known_for || [])
    .map((k) => k.title || k.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');

  return (
    <Link to={`/person/${person.id}`} className="group shrink-0 w-[140px] text-center">
      <div className="aspect-square rounded-full overflow-hidden bg-marquee-surface border border-marquee-border group-hover:border-marquee-gold/60 transition-colors mx-auto w-[110px]">
        {photo ? (
          <img src={photo} alt={person.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-marquee-muted">
            {person.name}
          </div>
        )}
      </div>
      <h4 className="mt-2 text-sm font-medium text-marquee-text truncate">{person.name}</h4>
      {knownFor && <p className="text-xs text-marquee-muted truncate">{knownFor}</p>}
    </Link>
  );
}
