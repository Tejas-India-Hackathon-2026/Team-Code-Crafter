import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function BookingChatModal({ booking, onClose }) {
  const { user, token } = useAuth();
  const { socket, addToast } = useNotification();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/bookings/${booking.id}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (active && data.success) setMessages(data.messages || []);
      } catch (err) {
        if (active) addToast({ title: 'Chat unavailable', message: 'Could not load this conversation.', type: 'danger' });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMessages();
    return () => {
      active = false;
    };
  }, [booking.id, token, addToast]);

  useEffect(() => {
    if (!socket) return undefined;

    socket.emit('join_booking_room', booking.id);
    const handleMessage = (message) => {
      if (message.bookingId !== booking.id) return;
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    };

    socket.on('booking_chat_message', handleMessage);
    return () => socket.off('booking_chat_message', handleMessage);
  }, [socket, booking.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Unable to send message');
      setMessages((current) => (current.some((item) => item.id === data.message.id) ? current : [...current, data.message]));
      setDraft('');
    } catch (err) {
      addToast({ title: 'Message not sent', message: err.message, type: 'danger' });
    } finally {
      setSending(false);
    }
  };

  const otherName = user?.role === 'customer' ? booking.workerName : booking.customerName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex h-[min(680px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-aqua-400 text-slate-950">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black">Chat with {otherName}</h2>
              <p className="truncate text-[11px] text-slate-400">{booking.workType} · Booking #{booking.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close chat">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">Start the conversation</p>
              <p className="mt-1 max-w-xs text-xs">Discuss timing, access details, or anything needed for this service.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isMine = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${isMine ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                      {!isMine && <p className="mb-1 text-[10px] font-bold text-aqua-700">{message.senderName}</p>}
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{message.message}</p>
                      <p className={`mt-1 text-[9px] ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>
                        {new Date(message.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(event);
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder="Write a message..."
              className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-aqua-400 focus:ring-2 focus:ring-aqua-100"
            />
            <button type="submit" disabled={!draft.trim() || sending} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-aqua-500 text-slate-950 shadow-sm transition hover:bg-aqua-400 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-slate-400">Press Enter to send · Shift + Enter for a new line</p>
        </form>
      </div>
    </div>
  );
}
