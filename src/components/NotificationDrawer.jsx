import React from 'react';
import { X, Bell, CheckCheck, Trash2, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function NotificationDrawer({ onClose, onNavigate }) {
  const { notifications, unreadCount, markAllAsRead, clearNotifications, markAsRead } = useNotification();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up mt-16 sm:mt-12">
        
        {/* Header */}
        <div className="p-4 sm:px-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-aqua-100 text-aqua-800 flex items-center justify-center font-bold">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Notifications</h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={clearNotifications}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 text-xs"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all text-left relative ${
                  !notif.read
                    ? 'bg-white border-aqua-200 shadow-sm'
                    : 'bg-white/80 border-slate-200/70 opacity-80'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-aqua-500" />
                )}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {notif.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : notif.type === 'danger' ? (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    ) : (
                      <Bell className="h-4 w-4 text-aqua-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {notif.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">
                      {notif.time || 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
