import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AppNotification } from '../types';
import { StorageService } from '../services/storageService';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  users: User[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  loginAsUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  refreshUserData: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshUserData = () => {
    StorageService.initializeDefaults();
    const allUsers = StorageService.getUsers();
    setUsers(allUsers);

    const currentId = StorageService.getCurrentUserId();
    const user = allUsers.find((u) => u.id === currentId) || allUsers[0] || null;
    setCurrentUser(user);

    if (user) {
      const notifs = StorageService.getNotifications(user.id);
      setNotifications(notifs);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  const loginAsUser = (userId: string) => {
    StorageService.setCurrentUserId(userId);
    const user = StorageService.getUserById(userId);
    if (user) {
      user.lastLogin = new Date().toISOString();
      StorageService.saveUser(user);
      StorageService.logAudit({
        userId: user.id,
        userName: `${(user.profile as any).firstName} ${(user.profile as any).lastName}`,
        userRole: user.role,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        description: `User authenticated into ${user.role} workspace.`,
      });
    }
    refreshUserData();
  };

  const switchRole = (targetRole: UserRole) => {
    const allUsers = StorageService.getUsers();
    const targetUser = allUsers.find((u) => u.role === targetRole && u.isActive) || allUsers.find((u) => u.role === targetRole);
    if (targetUser) {
      loginAsUser(targetUser.id);
    }
  };

  const logout = () => {
    if (currentUser) {
      StorageService.logAudit({
        userId: currentUser.id,
        userName: `${(currentUser.profile as any).firstName} ${(currentUser.profile as any).lastName}`,
        userRole: currentUser.role,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: currentUser.id,
        description: `User logged out.`,
      });
    }
    // Switch to default patient or clear
    loginAsUser('usr-patient-1');
  };

  const markNotificationRead = (id: string) => {
    StorageService.markNotificationRead(id);
    if (currentUser) {
      setNotifications(StorageService.getNotifications(currentUser.id));
    }
  };

  const markAllNotificationsRead = () => {
    if (currentUser) {
      StorageService.markAllNotificationsRead(currentUser.id);
      setNotifications(StorageService.getNotifications(currentUser.id));
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || 'PATIENT',
        users,
        notifications,
        unreadNotificationCount,
        loginAsUser,
        switchRole,
        logout,
        refreshUserData,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
