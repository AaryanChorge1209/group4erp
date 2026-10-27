import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, ChevronDown,
  User, Lock, LogOut, BookOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getRoleLabel, getRoleBadgeClass } from '../../lib/utils';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/notifications/unread-count').then(r => setUnread(r.data.count || 0)).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center px-4 gap-3 shadow-sm lg:left-60">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo on mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <BookOpen className="w-5 h-5 text-primary-600" />
        <span className="font-bold text-sm text-gray-900 dark:text-white">Kirti College ERP</span>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9 h-9 text-sm"
          placeholder="Search books, students, drives..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Academic year */}
        <select className="hidden sm:block select h-8 text-xs px-2 w-auto border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300">
          <option>2024-25</option>
          <option>2023-24</option>
        </select>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="btn-icon relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user?.name?.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">{getRoleLabel(user?.role)}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 card shadow-xl py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                <span className={`mt-1 ${getRoleBadgeClass(user?.role)}`}>{getRoleLabel(user?.role)}</span>
              </div>
              <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                <User className="w-4 h-4" /> My Profile
              </Link>
              <Link to="/change-password" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                <Lock className="w-4 h-4" /> Change Password
              </Link>
              <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                <button onClick={handleLogout} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
