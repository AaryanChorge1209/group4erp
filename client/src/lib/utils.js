import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function daysFromNow(date) {
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getRoleBadgeClass(role) {
  const map = {
    ADMIN: 'badge-purple',
    LIBRARIAN: 'badge-blue',
    STUDENT: 'badge-green',
    PLACEMENT_OFFICER: 'badge-amber',
    COMPANY: 'badge-indigo',
    ALUMNI: 'badge-gray',
  };
  return map[role] || 'badge-gray';
}

export function getRoleLabel(role) {
  const map = {
    ADMIN: 'Admin',
    LIBRARIAN: 'Librarian',
    STUDENT: 'Student',
    PLACEMENT_OFFICER: 'Placement Officer',
    COMPANY: 'Company',
    ALUMNI: 'Alumni',
  };
  return map[role] || role;
}
