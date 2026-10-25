import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const typeColors = {
  INFO: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  WARNING: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  SUCCESS: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  ERROR: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = () => {
    api.get('/notifications?limit=50').then(res => {
      setNotifications(res.data.notifications || res.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put('/notifications/read-all');
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) { toast.error('Failed'); }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll} className="btn-secondary btn-sm gap-2">
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark All Read
          </button>
        )}
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-slate-700">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${typeColors[n.type] || typeColors.INFO}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                {!n.isRead && <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
