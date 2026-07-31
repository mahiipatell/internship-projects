import { Link } from 'react-router-dom';
import { FaFilm } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <FaFilm className="text-5xl text-marquee-gold mb-4" />
      <h1 className="font-display text-6xl tracking-widest">404</h1>
      <p className="text-marquee-muted mt-2 mb-6">This scene didn't make the final cut.</p>
      <Link to="/" className="bg-marquee-gold text-marquee-bg font-semibold px-6 py-3 rounded-md hover:bg-marquee-goldMuted transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
