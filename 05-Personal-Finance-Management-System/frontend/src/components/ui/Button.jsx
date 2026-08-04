const VARIANTS = {
  primary:
    'bg-primary-500 hover:bg-primary-600 text-olive-900 shadow-soft hover:shadow-card hover:-translate-y-0.5',
  secondary:
    'bg-white hover:bg-cream text-olive-700 border border-olive-900/10 shadow-soft hover:-translate-y-0.5 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
  danger: 'bg-expense hover:brightness-95 text-white shadow-soft hover:-translate-y-0.5',
  ghost: 'bg-transparent hover:bg-olive-900/5 text-olive-700 dark:text-gray-200 dark:hover:bg-gray-800',
};

function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled = false,
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold
        transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0
        active:scale-[0.98]
        ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
