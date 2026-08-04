function getColor(percentage, isOverBudget) {
  if (isOverBudget || percentage >= 100) return 'bg-expense';
  if (percentage >= 90) return 'bg-primary-500';
  return 'bg-sage-500';
}

function ProgressBar({ percentage = 0, isOverBudget = false }) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="w-full h-2.5 rounded-full bg-olive-900/[0.06] dark:bg-gray-800 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${getColor(percentage, isOverBudget)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default ProgressBar;
