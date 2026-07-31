import { Link } from 'react-router-dom';
import { FaFilm, FaGithub } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t border-marquee-border mt-20 bg-marquee-surface/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FaFilm className="text-marquee-gold" />
          <span className="font-display text-xl tracking-widest">CINE<span className="text-marquee-gold">MATCH</span></span>
        </div>
        <p className="text-xs text-marquee-muted text-center">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Built for educational purposes.
        </p>
        <div className="flex gap-4 text-marquee-muted text-sm">
          <Link to="/movies" className="hover:text-marquee-gold">Movies</Link>
          <Link to="/tv" className="hover:text-marquee-gold">TV Shows</Link>
          <Link to="/trending" className="hover:text-marquee-gold">Trending</Link>
        </div>
      </div>
    </footer>
  );
}
