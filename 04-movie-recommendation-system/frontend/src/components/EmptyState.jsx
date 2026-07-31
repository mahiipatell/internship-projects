import { Link } from 'react-router-dom';

// Used whenever a list (watchlist, favorites, search results, etc.) has nothing to show.
// Follows the "empty screen is an invitation to act" writing guidance: explain
// what's missing and give a concrete next step.
export default function EmptyState({ title, message, actionLabel, actionTo, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-lg border border-dashed border-marquee-border bg-marquee-surface/40">
      {Icon && <Icon className="text-4xl text-marquee-gold/70 mb-4" />}
      <h3 className="font-display text-2xl tracking-wide text-marquee-text">{title}</h3>
      <p className="text-marquee-muted mt-2 max-w-sm">{message}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 px-5 py-2.5 rounded-md bg-marquee-gold text-marquee-bg font-semibold text-sm hover:bg-marquee-goldMuted transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
