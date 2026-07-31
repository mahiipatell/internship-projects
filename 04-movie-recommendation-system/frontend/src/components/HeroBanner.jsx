import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaInfoCircle, FaStar } from 'react-icons/fa';
import { tmdbImage } from '../services/api';

export default function HeroBanner({ item }) {
  if (!item) return null;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const title = item.title || item.name;
  const backdrop = tmdbImage(item.backdrop_path, 'original');
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);

  return (
    <section className="relative h-[92vh] min-h-[600px] w-full overflow-hidden">
      {backdrop && (
        <motion.img
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          src={backdrop}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}
      <div className="absolute inset-0 bg-marquee-gradient" />
      <div className="absolute inset-0 bg-gradient-to-r from-marquee-bg via-marquee-bg/40 to-transparent" />

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-xl"
        >
          <span className="inline-block text-marquee-gold text-xs font-bold tracking-[0.2em] uppercase mb-3">
            Now Trending
          </span>
          <h1 className="font-display text-5xl sm:text-6xl tracking-wide text-marquee-text text-shadow-marquee leading-none">
            {title}
          </h1>
          <div className="flex items-center gap-3 mt-4 text-sm text-marquee-muted">
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 text-marquee-gold font-semibold">
                <FaStar /> {item.vote_average.toFixed(1)}
              </span>
            )}
            {year && <span>{year}</span>}
            <span className="uppercase tracking-wide">{mediaType === 'tv' ? 'TV Series' : 'Movie'}</span>
          </div>
          <p className="mt-4 text-marquee-text/90 line-clamp-3">{item.overview}</p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              to={`/${mediaType}/${item.id}`}
              className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-md hover:bg-white/85 transition-colors"
            >
              <FaPlay /> Play
            </Link>
            <Link
              to={`/${mediaType}/${item.id}`}
              className="flex items-center gap-2 bg-marquee-muted/30 backdrop-blur border border-marquee-border text-marquee-text font-medium px-6 py-3 rounded-md hover:bg-marquee-muted/40 transition-colors"
            >
              <FaInfoCircle /> More Info
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
