import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg className="w-48 h-48 mx-auto text-gray-200 dark:text-slate-700" fill="none" viewBox="0 0 200 200" stroke="currentColor" strokeWidth="1">
            <circle cx="100" cy="100" r="80" />
            <path d="M70 80 h10 v10 h-10z M120 80 h10 v10 h-10z" fill="currentColor" />
            <path d="M70 130 Q100 110 130 130" strokeWidth="3" fill="none" />
            <text x="100" y="60" textAnchor="middle" className="text-6xl font-bold" fill="currentColor" fontSize="24">404</text>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved. Check the URL or navigate back.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/" className="btn-primary">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
