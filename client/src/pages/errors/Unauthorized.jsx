import { Link } from 'react-router-dom';
import { Home, ShieldOff } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldOff className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
        <Link to="/" className="btn-primary">
          <Home className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
