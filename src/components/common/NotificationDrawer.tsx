import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, X, CheckCheck, AlertTriangle, FileText, Pill, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntity?: (type: string, id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectEntity,
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuth();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'DOCTOR_UPDATE':
        return <FileText className="w-4 h-4 text-teal-600" />;
      case 'MEDICATION_REMINDER':
        return <Pill className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-start">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-800" />
            <h3 className="font-bold text-slate-900 text-sm">اعلان‌ها و هشدارهای بالینی</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                خوانده شد همه
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-slate-600">اعلانی وجود ندارد</p>
              <p className="text-[11px] text-slate-400 mt-1">
                در صورت فعال‌شدن هشدارهای ایمنی یا ثبت توصیه جدید توسط پزشک، پیام‌ها در این بخش نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              let timeFormatted = '';
              try {
                timeFormatted = formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true, locale: faIR });
              } catch (e) {
                timeFormatted = notif.createdAt;
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.relatedEntityType && notif.relatedEntityId && onSelectEntity) {
                      onSelectEntity(notif.relatedEntityType, notif.relatedEntityId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 text-right ${
                    !notif.isRead ? 'bg-teal-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{timeFormatted}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
