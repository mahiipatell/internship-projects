import { useEffect, useState, useMemo } from 'react';
import HeroBanner from '../components/HeroBanner';
import MovieRow from '../components/MovieRow';
import { moviesService, recommendationsService } from '../services/movies.service';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [tvPopular, setTvPopular] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState({ trending: true, popular: true, topRated: true, upcoming: true, tv: true, rec: true });

  useEffect(() => {
    moviesService.trending('all', 'week').then((d) => setTrending(d.results || [])).finally(() =>
      setLoading((l) => ({ ...l, trending: false }))
    );
    moviesService.popular('movie').then((d) => setPopular(d.results || [])).finally(() =>
      setLoading((l) => ({ ...l, popular: false }))
    );
    moviesService.topRated('movie').then((d) => setTopRated(d.results || [])).finally(() =>
      setLoading((l) => ({ ...l, topRated: false }))
    );
    moviesService.upcoming().then((d) => setUpcoming(d.results || [])).finally(() =>
      setLoading((l) => ({ ...l, upcoming: false }))
    );
    moviesService.popular('tv').then((d) => setTvPopular(d.results || [])).finally(() =>
      setLoading((l) => ({ ...l, tv: false }))
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading((l) => ({ ...l, rec: false }));
      return;
    }
    recommendationsService
      .get('movie')
      .then((d) => setRecommendations(d.results || []))
      .finally(() => setLoading((l) => ({ ...l, rec: false })));
  }, [isAuthenticated]);

  // Pick once per successful trending fetch (not on every re-render) so the
  // hero doesn't randomize itself away every time unrelated state updates.
  const heroItem = useMemo(() => {
    const withBackdrop = trending.filter((t) => t.backdrop_path);
    if (withBackdrop.length === 0) return trending[0];
    return withBackdrop[Math.floor(Math.random() * withBackdrop.length)];
  }, [trending]);

  return (
    <div>
      <HeroBanner item={heroItem} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        {isAuthenticated && (
          <MovieRow
            title="Recommended For You"
            items={recommendations}
            loading={loading.rec}
            mediaTypeOverride="movie"
            emptyMessage="Rate a few titles or add favorites to unlock personalized picks."
          />
        )}
        <MovieRow title="Trending This Week" items={trending} loading={loading.trending} />
        <MovieRow title="Popular Movies" items={popular} loading={loading.popular} mediaTypeOverride="movie" />
        <MovieRow title="Top Rated Movies" items={topRated} loading={loading.topRated} mediaTypeOverride="movie" />
        <MovieRow title="Popular TV Shows" items={tvPopular} loading={loading.tv} mediaTypeOverride="tv" />
        <MovieRow title="Upcoming Releases" items={upcoming} loading={loading.upcoming} mediaTypeOverride="movie" />
      </div>
    </div>
  );
}
