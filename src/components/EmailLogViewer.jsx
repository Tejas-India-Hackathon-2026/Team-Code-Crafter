import React, { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, Send, CheckCircle2, Clock, Inbox, Eye } from 'lucide-react';

export default function EmailLogViewer({ onClose }) {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchEmails = async () => { //
    setLoading(true);
    try {
      const res = await fetch('/api/emails/logs');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails || []);
        if (data.emails && data.emails.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter((e) => {
    if (filterType === 'all') return true;
    if (filterType === 'bookings') return e.type?.includes('booking');
    if (filterType === 'workers') return e.type?.includes('worker');
    if (filterType === 'auth') return e.type?.includes('registered') || e.type?.includes('password');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        {/* Top Header */}
        <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-aqua-100 text-aqua-700 flex items-center justify-center font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Transactional Email Dispatch Hub</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Live Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspect simulated and live automated notification emails triggered across user workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Filter:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full font-bold transition ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            All Emails ({emails.length})
          </button>
          <button
            onClick={() => setFilterType('bookings')}
            className={`px-3 py-1 rounded-full font-bold transition ${
              filterType === 'bookings' ? 'bg-aqua-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setFilterType('workers')}
            className={`px-3 py-1 rounded-full font-bold transition ${
              filterType === 'workers' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Worker Verification
          </button>
          <button
            onClick={() => setFilterType('auth')}
            className={`px-3 py-1 rounded-full font-bold transition ${
              filterType === 'auth' ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Accounts & Reset
          </button>
        </div>

        {/* Split View Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Email List */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {filteredEmails.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No emails recorded for this filter.
              </div>
            ) : (
              filteredEmails.map((em) => (
                <div
                  key={em.id}
                  onClick={() => setSelectedEmail(em)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition text-left ${
                    selectedEmail?.id === em.id
                      ? 'bg-white border-aqua-400 shadow-md ring-2 ring-aqua-200/50'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      To: {em.recipientName || em.to}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {em.sentAt ? new Date(em.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {em.subject}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {em.previewText || em.subject}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {em.type}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Column: HTML Preview Pane */}
          <div className="md:col-span-7 bg-slate-100 overflow-y-auto p-4 sm:p-6 flex flex-col justify-start">
            {selectedEmail ? (
              <div className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-300 shadow-lg overflow-hidden animate-fade-in">
                
                {/* Meta top bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">To:</span>
                    <span className="font-bold text-slate-800">{selectedEmail.recipientName} &lt;{selectedEmail.to}&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Subject:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[280px] sm:max-w-[360px]">{selectedEmail.subject}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Sent Time:</span>
                    <span className="text-slate-500">{new Date(selectedEmail.sentAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Email HTML Frame / Render */}
                <div
                  className="p-6 text-slate-800 text-sm overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-slate-400 text-xs">
                Select an email from the list to preview the template.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
