import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { moviesService } from '../services/movies.service';
import { userService } from '../services/auth.service';
import Loader from '../components/Loader';

// Shown once after registration so the recommendation engine has an
// immediate genre-affinity signal instead of starting completely cold.
export default function Onboarding() {
  const [genres, setGenres] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    moviesService
      .genres('movie')
      .then((data) => setGenres(data.genres || []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (genre) => {
    setSelected((prev) =>
      prev.some((g) => g.genreId === genre.id)
        ? prev.filter((g) => g.genreId !== genre.id)
        : [...prev, { genreId: genre.id, genreName: genre.name }]
    );
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      if (selected.length > 0) {
        await userService.setFavoriteGenres(selected);
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-[85vh] max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="font-display text-4xl tracking-widest mb-2">PICK YOUR GENRES</h1>
      <p className="text-marquee-muted mb-10">
        Choose a few genres you love — we'll use them to personalize your recommendations right away.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {genres.map((g) => {
          const active = selected.some((s) => s.genreId === g.id);
          return (
            <button
              key={g.id}
              onClick={() => toggle(g)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-marquee-gold text-marquee-bg border-marquee-gold'
                  : 'border-marquee-border text-marquee-muted hover:text-marquee-gold hover:border-marquee-gold'
              }`}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-marquee-muted hover:text-marquee-text"
        >
          Skip for now
        </button>
        <button
          onClick={handleContinue}
          disabled={saving}
          className="bg-marquee-gold text-marquee-bg font-semibold px-8 py-3 rounded-md hover:bg-marquee-goldMuted transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
