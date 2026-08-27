import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { RoleBadge } from './RoleBadge';
import { NotificationDrawer } from './NotificationDrawer';
import {
  Activity,
  Bell,
  RotateCcw,
  Users,
  ChevronDown,
  Stethoscope,
  User as UserIcon,
  Shield,
  ClipboardList,
} from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface HeaderProps {
  onOpenNewEntryModal?: () => void;
  onNavigateToView?: (viewId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewEntryModal, onNavigateToView }) => {
  const { currentUser, currentRole, users, unreadNotificationCount, switchRole, loginAsUser, refreshUserData } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const roleOptions: { role: UserRole; label: string; icon: any }[] = [
    { role: 'PATIENT', label: 'پنل بیمار', icon: UserIcon },
    { role: 'DOCTOR', label: 'پنل پزشک', icon: Stethoscope },
    { role: 'OPERATOR', label: 'پنل اپراتور', icon: ClipboardList },
    { role: 'ADMIN', label: 'پنل مدیریت', icon: Shield },
  ];

  const handleResetData = () => {
    if (window.confirm('آیا مایلید تمام سوابق درد، هشدارهای بالینی و اطلاعات کاربری به داده‌های پیش‌فرض بالینی بازنشانی شوند؟')) {
      StorageService.resetToSeedData();
      refreshUserData();
      alert('پایگاه داده بالینی با موفقیت بازنشانی شد.');
    }
  };

  const currentUserName = currentUser
    ? `${(currentUser.profile as any).firstName} ${(currentUser.profile as any).lastName}`
    : 'مهمان';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Clinical System Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-xs">
                  <Activity className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                      سامانه بالینی <span className="text-teal-700">پایش درد</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 hidden sm:inline-block">
                      نسخه تخصصی
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium hidden md:block">
                    ثبت هوشمند، نقشه آناتومیک و پایش ایمنی درمان درد
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Role Switcher Bar (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" /> نقش کاربری:
              </span>
              {roleOptions.map((item) => {
                const isActive = currentRole === item.role;
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    id={`role-switch-${item.role.toLowerCase()}`}
                    onClick={() => switchRole(item.role)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Actions: Notifications, Reset DB, User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Log Pain Button (If in Patient view) */}
              {currentRole === 'PATIENT' && onOpenNewEntryModal && (
                <button
                  type="button"
                  id="header-quick-log-btn"
                  onClick={onOpenNewEntryModal}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <Activity className="w-4 h-4 text-teal-200" />
                  <span>ثبت نوبت درد</span>
                </button>
              )}

              {/* Notification Bell */}
              <button
                type="button"
                id="header-notifications-btn"
                onClick={() => setShowNotifDrawer(true)}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                title="اعلان‌ها و هشدارها"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-red-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Reset Database Button */}
              <button
                type="button"
                onClick={handleResetData}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 hidden sm:flex items-center gap-1 text-xs"
                title="بازنشانی داده‌های نمونه به حالت اولیه"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden xl:inline">بازنشانی داده‌ها</span>
              </button>

              {/* Active User Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  id="header-user-menu-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors bg-white shadow-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUserName.charAt(0)}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {currentUserName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {currentRole === 'PATIENT' ? 'بیمار' : currentRole === 'DOCTOR' ? 'پزشک متخصص' : currentRole === 'OPERATOR' ? 'اپراتور' : 'مدیر سیستم'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-right"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        حساب کاربری فعال
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-slate-900">{currentUserName}</span>
                        <RoleBadge role={currentRole} size="sm" />
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{currentUser?.username}</p>
                    </div>

                    {/* Switch Persona Options */}
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      تغییر کاربر نمونه
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {users.map((u) => {
                        const name = `${(u.profile as any).firstName} ${(u.profile as any).lastName}`;
                        const isCurrent = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => loginAsUser(u.id)}
                            className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                              isCurrent ? 'bg-teal-50/60 font-bold text-teal-900' : 'text-slate-700'
                            }`}
                          >
                            <div className="truncate">
                              <div>{name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {u.role === 'PATIENT' ? 'بیمار' : u.role === 'DOCTOR' ? 'پزشک متخصص' : u.role === 'OPERATOR' ? 'اپراتور' : 'مدیر سیستم'}
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Role Switcher in Dropdown */}
                    <div className="lg:hidden border-t border-slate-100 pt-2 px-3">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                        تغییر پنل دسترسی
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {roleOptions.map((opt) => (
                          <button
                            key={opt.role}
                            type="button"
                            onClick={() => switchRole(opt.role)}
                            className={`px-2 py-1.5 text-xs rounded font-medium border text-center ${
                              currentRole === opt.role
                                ? 'bg-teal-700 text-white border-teal-800'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        onSelectEntity={(type) => {
          if (type === 'ClinicalAlert' && onNavigateToView) {
            onNavigateToView('alerts');
          } else if (type === 'DoctorNote' && onNavigateToView) {
            onNavigateToView('doctor-notes');
          }
        }}
      />
    </>
  );
};
