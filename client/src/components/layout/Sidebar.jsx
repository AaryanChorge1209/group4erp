import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, Users, BookMarked, ArrowRightLeft,
  AlertTriangle, DollarSign, List, BookCopy, BookUp, Wifi,
  Briefcase, Building2, CalendarDays, FileText, GraduationCap,
  Heart, UserCheck, Settings, ScrollText, Database, Search,
  Bell, X, ChevronDown, ChevronRight, Archive, Layers
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { getRoleLabel, getRoleBadgeClass } from '../../lib/utils';

const NAV_CONFIG = {
  ADMIN: [
    { label: 'OVERVIEW', items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ]},
    { label: 'LIBRARY', items: [
      { to: '/library/dashboard', icon: BookOpen, label: 'Library Dashboard' },
      { to: '/library/books', icon: BookMarked, label: 'Book Catalog' },
      { to: '/library/checkout', icon: BookUp, label: 'Checkout Book' },
      { to: '/library/return', icon: ArrowRightLeft, label: 'Return Book' },
      { to: '/library/issues', icon: List, label: 'Issue Tracking' },
      { to: '/library/overdue', icon: AlertTriangle, label: 'Overdue' },
      { to: '/library/fines', icon: DollarSign, label: 'Fine Management' },
      { to: '/library/reservations', icon: BookCopy, label: 'Reservations' },
      { to: '/library/digital', icon: Database, label: 'Digital Library' },
      { to: '/library/opac', icon: Search, label: 'OPAC Search' },
    ]},
    { label: 'PLACEMENT', items: [
      { to: '/placement/dashboard', icon: Briefcase, label: 'Placement Dashboard' },
      { to: '/placement/companies', icon: Building2, label: 'Companies' },
      { to: '/placement/drives', icon: CalendarDays, label: 'Drives' },
      { to: '/placement/applications', icon: FileText, label: 'Applications' },
    ]},
    { label: 'ALUMNI', items: [
      { to: '/alumni/directory', icon: GraduationCap, label: 'Alumni Directory' },
      { to: '/alumni/mentorship', icon: UserCheck, label: 'Mentorship' },
      { to: '/alumni/donations', icon: Heart, label: 'Donations' },
    ]},
    { label: 'REPORTS', items: [
      { to: '/reports/library', icon: Archive, label: 'Library Reports' },
      { to: '/reports/placement', icon: Layers, label: 'Placement Reports' },
    ]},
  ],
  LIBRARIAN: [
    { label: 'OVERVIEW', items: [
      { to: '/library/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { label: 'LIBRARY', items: [
      { to: '/library/books', icon: BookMarked, label: 'Book Catalog' },
      { to: '/library/opac', icon: Search, label: 'OPAC Search' },
      { to: '/library/checkout', icon: BookUp, label: 'Checkout' },
      { to: '/library/return', icon: ArrowRightLeft, label: 'Return' },
      { to: '/library/issues', icon: List, label: 'Issue Tracking' },
      { to: '/library/overdue', icon: AlertTriangle, label: 'Overdue Books' },
      { to: '/library/fines', icon: DollarSign, label: 'Fine Management' },
      { to: '/library/reservations', icon: BookCopy, label: 'Reservations' },
      { to: '/library/digital', icon: Database, label: 'Digital Library' },
    ]},
    { label: 'REPORTS', items: [
      { to: '/reports/library', icon: FileText, label: 'Library Reports' },
    ]},
  ],
  STUDENT: [
    { label: 'OVERVIEW', items: [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { label: 'LIBRARY', items: [
      { to: '/library/books', icon: BookMarked, label: 'Book Catalog' },
      { to: '/library/checkout', icon: BookUp, label: 'Book Checkout' },
      { to: '/library/return', icon: ArrowRightLeft, label: 'Book Return' },
      { to: '/library/opac', icon: Search, label: 'Search Books (OPAC)' },
      { to: '/library/digital', icon: Database, label: 'Digital Library' },
      { to: '/student/books', icon: BookMarked, label: 'My Books' },
      { to: '/student/fines', icon: DollarSign, label: 'My Fines' },
      { to: '/student/reservations', icon: BookCopy, label: 'My Reservations' },
    ]},
    { label: 'PLACEMENT', items: [
      { to: '/placement/drives', icon: CalendarDays, label: 'Placement Drives' },
      { to: '/student/applications', icon: FileText, label: 'My Applications' },
    ]},
    { label: 'ALUMNI', items: [
      { to: '/alumni/directory', icon: GraduationCap, label: 'Alumni Directory' },
      { to: '/alumni/mentorship', icon: UserCheck, label: 'Find a Mentor' },
    ]},
  ],
  PLACEMENT_OFFICER: [
    { label: 'OVERVIEW', items: [
      { to: '/placement/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { label: 'PLACEMENT', items: [
      { to: '/placement/companies', icon: Building2, label: 'Companies' },
      { to: '/placement/drives', icon: CalendarDays, label: 'Drives' },
      { to: '/placement/applications', icon: FileText, label: 'Applications' },
    ]},
    { label: 'ALUMNI', items: [
      { to: '/alumni/directory', icon: GraduationCap, label: 'Alumni Directory' },
    ]},
    { label: 'REPORTS', items: [
      { to: '/reports/placement', icon: Layers, label: 'Placement Reports' },
    ]},
  ],
  COMPANY: [
    { label: 'OVERVIEW', items: [
      { to: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { label: 'RECRUITMENT', items: [
      { to: '/placement/drives', icon: CalendarDays, label: 'My Drives' },
      { to: '/placement/applications', icon: FileText, label: 'Applicants' },
    ]},
  ],
  ALUMNI: [
    { label: 'OVERVIEW', items: [
      { to: '/alumni/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { label: 'NETWORK', items: [
      { to: '/alumni/directory', icon: GraduationCap, label: 'Alumni Directory' },
      { to: '/alumni/mentorship', icon: UserCheck, label: 'Mentorship' },
      { to: '/alumni/donations', icon: Heart, label: 'Donations' },
    ]},
  ],
};

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
      }
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const sections = NAV_CONFIG[user?.role] || [];
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 z-40 flex flex-col
        bg-navy-600 dark:bg-navy-900
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Kirti College ERP</p>
            <p className="text-slate-400 text-xs truncate">College Management</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((section, si) => (
            <div key={si}>
              <p className="section-label">{section.label}</p>
              {section.items.map((item, ii) => (
                <NavItem key={ii} item={item} />
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-white/10 p-3">
          <NavLink to="/profile" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{getRoleLabel(user?.role)}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
