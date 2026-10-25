import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const segmentLabels = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  users: 'Users',
  students: 'Students',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  library: 'Library',
  books: 'Books',
  checkout: 'Checkout',
  return: 'Return',
  issues: 'Issues',
  overdue: 'Overdue Books',
  fines: 'Fines',
  reservations: 'Reservations',
  digital: 'Digital Library',
  opac: 'OPAC Search',
  placement: 'Placement',
  companies: 'Companies',
  drives: 'Drives',
  applications: 'Applications',
  alumni: 'Alumni',
  directory: 'Directory',
  mentorship: 'Mentorship',
  donations: 'Donations',
  reports: 'Reports',
  notifications: 'Notifications',
  profile: 'Profile'
};

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="hidden md:flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
      <Link to="/" className="hover:text-primary-600 flex items-center gap-1 transition">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = segmentLabels[value] || (value.length > 15 ? `${value.slice(0, 12)}...` : value);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            {isLast ? (
              <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                {label}
              </span>
            ) : (
              <Link to={to} className="hover:text-primary-600 capitalize transition">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
