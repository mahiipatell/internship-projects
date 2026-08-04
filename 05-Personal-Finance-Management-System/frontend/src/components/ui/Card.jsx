function Card({ children, className = '', title, subtitle, action, hover = false }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-gray-900 border border-olive-900/5 dark:border-gray-800
        shadow-soft p-6 transition-all duration-200 ease-out
        ${hover ? 'hover:-translate-y-1 hover:shadow-card cursor-pointer' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="font-semibold text-olive-900 dark:text-gray-100">{title}</h3>
            )}
            {subtitle && <p className="text-xs text-olive-600/70 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export default Card;
