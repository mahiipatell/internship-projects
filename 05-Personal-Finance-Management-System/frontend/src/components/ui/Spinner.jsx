function Spinner({ size = 24, className = '' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-olive-900/10 border-t-primary-500 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default Spinner;
