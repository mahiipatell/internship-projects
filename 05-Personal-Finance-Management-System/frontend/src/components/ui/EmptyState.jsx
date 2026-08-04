function EmptyState({ emoji = '🎉', title, description, action }) {
  return (
    <div className="text-center py-14 px-4">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-olive-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-olive-600/70 max-w-xs mx-auto mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}

export default EmptyState;
