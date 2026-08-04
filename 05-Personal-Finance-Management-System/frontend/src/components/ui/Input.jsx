import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-olive-700 dark:text-gray-300">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white dark:bg-gray-900
          text-olive-900 dark:text-gray-100 placeholder-olive-600/40
          transition-shadow duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
          ${error ? 'border-expense/60' : 'border-olive-900/10 dark:border-gray-700'} ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-expense">{error}</span>}
    </div>
  );
});

export default Input;
