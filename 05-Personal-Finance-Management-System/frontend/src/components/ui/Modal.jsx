import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-olive-900/30 backdrop-blur-sm animate-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-gray-900 rounded-2xl shadow-lift
          max-h-[90vh] overflow-y-auto animate-in zoom-in-95`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-olive-900/5 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-olive-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-olive-900/5 dark:hover:bg-gray-800 text-olive-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
