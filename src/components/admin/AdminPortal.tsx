import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, AuditLog, ClinicalRuleConfig, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { MASTER_MEDICATIONS, BODY_ZONES } from '../../data/seedData';
import { RoleBadge } from '../common/RoleBadge';
import { StatsCard } from '../common/StatsCard';
import {
  ShieldCheck,
  Users,
  Sliders,
  FileSpreadsheet,
  Database,
  Search,
  Plus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

export const AdminPortal: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'USERS' | 'RULES' | 'MASTER_DATA'>('AUDIT');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [rules, setRules] = useState<ClinicalRuleConfig[]>(() => StorageService.getClinicalRules());
  const [searchAudit, setSearchAudit] = useState<string>('');

  // Add User Modal state
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('DOCTOR');
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, isEnabled: enabled } : r));
    setRules(updated);
    StorageService.saveClinicalRules(updated);
  };

  const handleToggleUserActive = (userId: string, currentActive: boolean) => {
    const user = StorageService.getUserById(userId);
    if (user) {
      user.isActive = !currentActive;
      StorageService.saveUser(user);
      setUsers(StorageService.getUsers());
      refreshUserData();
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newFirstName || !newLastName) return;

    const newUser: User = {
      id: `usr-${newRole.toLowerCase()}-${Date.now()}`,
      username: newUsername,
      role: newRole,
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        firstName: newFirstName,
        lastName: newLastName,
        specialty: newRole === 'DOCTOR' ? 'متخصص کنترل درد' : undefined,
      } as any,
    };

    StorageService.saveUser(newUser);
    StorageService.logAudit({
      userId: currentUser?.id || 'usr-admin-1',
      userName: `${(currentUser?.profile as any)?.firstName || 'مریم'} ${(currentUser?.profile as any)?.lastName || 'تهرانی'}`,
      userRole: 'ADMIN',
      action: 'USER_MANAGEMENT',
      entityType: 'User',
      entityId: newUser.id,
      description: `مدیر ارشد حساب کاربری جدید ${newUsername} با نقش ${newRole} ایجاد نمود`,
    });

    setUsers(StorageService.getUsers());
    setAuditLogs(StorageService.getAuditLogs());
    setShowAddUser(false);
    setNewUsername('');
    setNewFirstName('');
    setNewLastName('');
  };

  const filteredAudits = auditLogs.filter((log) => {
    if (!searchAudit.trim()) return true;
    const q = searchAudit.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      log.entityType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Admin Header */}
      <div className="bg-gradient-to-l from-purple-950 via-slate-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-900 text-purple-200 border border-purple-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              پنل مدیریت ارشد، انطباق قانونی و حاکمیت بالینی
            </span>
            <span className="text-xs text-slate-400">ثبت وقایع امنیتی و ممیزی فعال است</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
            لاگ‌های ممیزی بالینی، مدیریت کاربران و تنظیم قوانین ایمنی
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            بررسی تاریخچه تغییرات و دسترسی‌ها، پیکربندی آستانه حساسیت هشدارهای خودکار و تعیین سطوح دسترسی نقش‌ها
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="تعداد رکوردهای ممیزی"
          value={auditLogs.length}
          subtext="ثبت وقایع بالینی و امنیتی"
          icon={FileSpreadsheet}
          variant="default"
        />
        <StatsCard
          title="کاربران فعال سامانه"
          value={users.filter((u) => u.isActive).length}
          subtext={`در ۴ سطح دسترسی بالینی`}
          icon={Users}
          variant="teal"
        />
        <StatsCard
          title="قوانین ایمنی فعال"
          value={rules.filter((r) => r.isEnabled).length}
          subtext="موتور هوشمند تشخیص خطر"
          icon={Sliders}
          variant="emerald"
        />
        <StatsCard
          title="نواحی آناتومیک پایه"
          value={BODY_ZONES.length}
          subtext="نواحی استاندارد پزشکی"
          icon={Database}
          variant="default"
        />
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 shadow-xs gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'AUDIT'
              ? 'border-purple-700 text-purple-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>لاگ‌های ممیزی و امنیتی ({auditLogs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'USERS'
              ? 'border-purple-700 text-purple-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>حساب‌های کاربری و سطوح دسترسی ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RULES')}
          className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'RULES'
              ? 'border-purple-700 text-purple-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>پیکربندی قوانین هشدار ({rules.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MASTER_DATA')}
          className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'MASTER_DATA'
              ? 'border-purple-700 text-purple-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>اطلاعات پایه و دارونامه</span>
        </button>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                لاگ‌های تغییرناپذیر ممیزی و امنیت
              </h3>
              <p className="text-xs text-slate-500">ردیابی تمامی رویدادهای ثبت، ویرایش، تریاژ و تغییر دسترسی‌ها</p>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder="جستجو در لاگ‌های ممیزی..."
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border-slate-200 shadow-xs text-right"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pl-1">
            {filteredAudits.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]" dir="ltr">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">{log.userName}</span>
                    <RoleBadge role={log.userRole} size="sm" />
                  </div>
                  <p className="text-slate-600 text-xs">{log.description}</p>
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                    موجودیت: {log.entityType} ({log.entityId})
                  </span>
                </div>

                <div className="text-left shrink-0 text-[11px] text-slate-400 font-mono">
                  {format(parseISO(log.timestamp), 'd MMM yyyy - HH:mm', { locale: faIR })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USERS & RBAC */}
      {activeTab === 'USERS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              حساب‌های کاربری و مجوزهای سطوح دسترسی
            </h3>
            <button
              type="button"
              onClick={() => setShowAddUser(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ایجاد کاربر جدید</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const name = `${(u.profile as any).firstName} ${(u.profile as any).lastName}`;
              return (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{name}</span>
                        <RoleBadge role={u.role} size="sm" />
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]" dir="ltr">{u.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleUserActive(u.id, u.isActive)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {u.isActive ? 'فعال' : 'غیرفعال‌شده'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RULES CONFIG */}
      {activeTab === 'RULES' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              قوانین خودکار تشخیص و صدور هشدارهای بالینی
            </h3>
            <p className="text-xs text-slate-500">
              تنظیم حساسیت و فعال/غیرفعال‌سازی آلارم‌های بلادرنگ سیستم ایمنی
            </p>
          </div>

          <div className="space-y-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                        r.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : r.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.severity === 'CRITICAL' ? 'بحرانی' : r.severity === 'HIGH' ? 'بالا' : 'متوسط'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{r.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r.isEnabled}
                      onChange={(e) => handleToggleRule(r.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MASTER DATA */}
      {activeTab === 'MASTER_DATA' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              دارونامه استاندارد مسکن‌ها و داروهای ضد درد ({MASTER_MEDICATIONS.length})
            </h3>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
              {MASTER_MEDICATIONS.map((m) => (
                <div key={m.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="text-slate-400 block text-[11px]">دوز استاندارد: {m.standardDose}</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                    {m.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              نواحی آناتومیک استاندارد بدن ({BODY_ZONES.length})
            </h3>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
              {BODY_ZONES.map((z) => (
                <div key={z.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{z.name}</span>
                    <span className="text-slate-400 block text-[11px] font-mono" dir="ltr">{z.id}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                    {z.parentRegion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-right">
            <h3 className="text-base font-bold text-slate-900">ایجاد حساب کاربری جدید</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نقش دسترسی</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="PATIENT">بیمار (Patient)</option>
                  <option value="DOCTOR">پزشک / متخصص بالینی (Doctor)</option>
                  <option value="OPERATOR">اپراتور پذیرش / تله‌هلث (Operator)</option>
                  <option value="ADMIN">مدیر ارشد سامانه (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نام کاربری / شناسه ورود</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="مثال: dr_moradi"
                  className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 font-mono text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نام</label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نام خانوادگی</label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  ایجاد حساب کاربری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
