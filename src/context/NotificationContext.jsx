import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_init_1',
      title: 'Welcome to WorkerConnect',
      message: 'Find and book certified skilled workers near you in minutes.',
      type: 'info',
      time: 'Just now',
      read: false,
    },
  ]);
  const [toasts, setToasts] = useState([]);

  // Add toast alert
  const addToast = useCallback((toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newToast = { id, ...toast, duration: toast.duration || 5000 };
    setToasts((prev) => [newToast, ...prev]);

    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Add persistent in-app notification
  const addNotification = useCallback(
    (notif) => {
      const id = Date.now().toString(36);
      const newNotif = {
        id,
        time: 'Just now',
        read: false,
        ...notif,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Also trigger a toast popup
      addToast({
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
      });
    },
    [addToast]
  );

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Socket.IO Setup
  useEffect(() => {
    // Connect to server
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to WorkerConnect Real-Time Notification Engine');
      if (user) {
        socketInstance.emit('join_user_room', { userId: user.id, role: user.role });
      }
    });

    // 1. Worker receives new booking request
    socketInstance.on('new_booking_notification', (booking) => {
      addNotification({
        title: '🔔 New Booking Request!',
        message: `${booking.customerName} sent a booking request for "${booking.workType}" on ${booking.preferredDate}.`,
        type: 'success',
        bookingId: booking.id,
      });
    });

    // 2. Customer receives booking status update (accepted / rejected / cancelled)
    socketInstance.on('booking_status_updated', (data) => {
      let type = 'info';
      if (data.status === 'accepted') type = 'success';
      if (data.status === 'rejected') type = 'danger';

      addNotification({
        title:
          data.status === 'accepted'
            ? '🎉 Booking Accepted!'
            : data.status === 'rejected'
            ? '❌ Booking Request Rejected'
            : 'Booking Updated',
        message: data.message || `Your booking status changed to ${data.status}.`,
        type,
        bookingId: data.bookingId,
      });
    });

    // 3. Booking chat message notification when the conversation is closed
    socketInstance.on('booking_chat_notification', (data) => {
      addNotification({
        title: `New message from ${data.senderName}`,
        message: data.message,
        type: 'info',
        bookingId: data.bookingId,
      });
    });

    // 4. Admin receives new worker application notification
    socketInstance.on('admin_new_worker_application', (worker) => {
      addNotification({
        title: '📝 New Worker Verification Request',
        message: `${worker.fullName} (${worker.skill}, ${worker.experience} yrs exp) submitted an application.`,
        type: 'warning',
        workerId: worker.id,
      });
    });

    // 5. Worker receives verification result
    socketInstance.on('worker_verification_result', (data) => {
      addNotification({
        title: data.status === 'approved' ? '🚀 Account Approved!' : 'Account Verification Notice',
        message: data.message || (data.status === 'approved' ? 'Your account is now live and approved by Admin.' : data.reason),
        type: data.status === 'approved' ? 'success' : 'danger',
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        addNotification,
        markAllAsRead,
        markAsRead,
        clearNotifications,
        socket,
      }}
    >
      {children}
      {/* Real-time floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-aqua-md border transition-all duration-300 transform translate-y-0 animate-slide-up ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-emerald-900'
                : toast.type === 'danger'
                ? 'bg-white border-rose-300 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-white border-amber-300 text-amber-900'
                : 'bg-white border-aqua-300 text-slate-900'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
                  ✓
                </span>
              ) : toast.type === 'danger' ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold">
                  ✕
                </span>
              ) : toast.type === 'warning' ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold">
                  ⚠
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aqua-100 text-aqua-700 font-bold">
                  ⚡
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 text-xs font-semibold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
}
