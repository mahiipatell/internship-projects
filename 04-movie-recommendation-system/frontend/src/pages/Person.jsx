import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { moviesService } from '../services/movies.service';
import { tmdbImage } from '../services/api';
import MovieGrid from '../components/MovieGrid';
import Loader from '../components/Loader';

export default function Person() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    moviesService
      .person(id)
      .then(setPerson)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader fullScreen />;
  if (!person) return null;

  const photo = tmdbImage(person.profile_path, 'w342');
  const credits = (person.combined_credits?.cast || [])
    .filter((c) => c.poster_path)
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 18);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-48 shrink-0 mx-auto md:mx-0">
          <div className="rounded-lg overflow-hidden border border-marquee-border">
            {photo ? (
              <img src={photo} alt={person.name} className="w-full" />
            ) : (
              <div className="aspect-[2/3] bg-marquee-surface flex items-center justify-center text-marquee-muted text-sm p-4 text-center">
                {person.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1">
          <h1 className="font-display text-4xl tracking-wide">{person.name}</h1>
          <p className="text-marquee-muted text-sm mt-1">{person.known_for_department}</p>
          {person.birthday && (
            <p className="text-marquee-muted text-sm mt-2">
              Born {person.birthday} {person.place_of_birth && `· ${person.place_of_birth}`}
            </p>
          )}
          {person.biography && <p className="mt-4 text-marquee-text/90 leading-relaxed max-w-3xl line-clamp-[12]">{person.biography}</p>}
        </div>
      </div>

      {credits.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl tracking-wide mb-4">Known For</h2>
          <MovieGrid items={credits} />
        </section>
      )}
    </div>
  );
}
