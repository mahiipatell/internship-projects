// Simple reusable loading indicator used across pages while data fetches.
export default function Loader({ fullScreen = false, label = 'Loading…' }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 rounded-full border-2 border-marquee-border border-t-marquee-gold animate-spin" />
      <span className="text-sm text-marquee-muted font-body">{label}</span>
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-[60vh] flex items-center justify-center">{spinner}</div>;
  }
  return <div className="py-16 flex items-center justify-center">{spinner}</div>;
}
