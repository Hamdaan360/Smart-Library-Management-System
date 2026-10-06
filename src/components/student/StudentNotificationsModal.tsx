import React from 'react';
import { LibraryNotification } from '../../types';
import { markNotificationAsRead } from '../../lib/libraryService';
import { X, Bell, CheckCircle2, Clock, AlertTriangle, BookMarked, BookmarkCheck, Receipt, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: LibraryNotification[];
  onRefresh: () => void;
}

export const StudentNotificationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <BookMarked className="w-4 h-4 text-blue-600" />;
      case 'return':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'due_soon':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'reservation_available':
        return <BookmarkCheck className="w-4 h-4 text-indigo-600" />;
      case 'fine':
        return <Receipt className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Notifications & Circulation Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No notifications yet. You will receive alerts when books are issued, returned, or approaching their due dates.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                  n.read
                    ? 'bg-slate-50/70 border-slate-200 text-slate-600'
                    : 'bg-blue-50/50 border-blue-200 text-slate-900 shadow-2xs font-medium'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-2xs shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-bold text-xs truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {typeof n.createdAt === 'string' && n.createdAt.includes('T')
                          ? n.createdAt.split('T')[0]
                          : n.createdAt
                          ? String(n.createdAt)
                          : 'Recent'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                    {!n.read && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-blue-900 hover:underline">
                        Click to mark as read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
