export default function StatCard({ label, value, icon: Icon, accent = 'gold' }) {
  const accentClass = accent === 'crimson' ? 'text-marquee-crimson' : 'text-marquee-gold';
  return (
    <div className="bg-marquee-surface border border-marquee-border rounded-lg p-5 flex items-center gap-4">
      {Icon && (
        <div className={`h-11 w-11 rounded-full bg-marquee-surface2 flex items-center justify-center ${accentClass} text-lg shrink-0`}>
          <Icon />
        </div>
      )}
      <div>
        <p className="text-2xl font-display tracking-wide text-marquee-text">{value}</p>
        <p className="text-xs text-marquee-muted uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}
