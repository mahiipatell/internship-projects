import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-gray-950 px-4">
      <div className="w-full max-w-md animate-page-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl">💰</span>
          <span className="font-bold text-2xl text-olive-900 dark:text-gray-100">
            Expense Tracker
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-olive-900/5 dark:border-gray-800 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
