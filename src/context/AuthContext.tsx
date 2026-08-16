import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import * as db from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  forgotPassword: (email: string) => { success: boolean; message: string };
  resetPassword: (token: string, newPassword: string) => { success: boolean; message: string };
  sessionTimeout: number | null;
  registerUser: (user: User, password: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>, newPassword?: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  getCredentials: () => Record<string, string>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  restoreUsers: (users: User[]) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_DURATION = 30 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const [resetTokens] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load users + credentials from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { users: loadedUsers, credentials: loadedCreds } = await db.fetchUsers();
        if (cancelled) return;
        if (loadedUsers.length === 0) {
          // Seed default admin so login still works on a fresh DB
          const admin: User = { id: 'u1', name: 'Dr. Maria Santos', email: 'admin@gmail.com', role: 'admin', department: 'Administration', adminId: 'ADM-2024-001', status: 'active', createdAt: '2024-01-10' };
          await db.upsertUser(admin, 'admin123');
          setUsers([admin]);
          setCredentials({ 'admin@gmail.com': 'admin123' });
        } else {
          setUsers(loadedUsers);
          setCredentials(loadedCreds);
        }
        setLoading(false);
      } catch (err) {
        console.error('AuthContext load failed:', err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const expiry = Date.now() + SESSION_DURATION;
    setSessionTimeout(expiry);
    const timer = setTimeout(() => {
      setCurrentUser(null);
      setSessionTimeout(null);
    }, SESSION_DURATION);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);

  const login = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = normalizeEmail(email);
    const expectedPassword = credentials[normalizedEmail];
    if (!expectedPassword || expectedPassword !== password) return false;
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!user || user.status === 'inactive') return false;
    setCurrentUser(user);
    return true;
  }, [credentials, users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setSessionTimeout(null);
  }, []);

  const forgotPassword = useCallback((email: string): { success: boolean; message: string } => {
    const normalizedEmail = normalizeEmail(email);
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!user) return { success: false, message: 'No account found with that email address.' };
    const token = Math.random().toString(36).substring(2, 15);
    resetTokens.set(token, normalizedEmail);
    return { success: true, message: `Password reset instructions sent to ${email}. (Demo token: ${token})` };
  }, [users, resetTokens]);

  const resetPassword = useCallback((token: string, newPassword: string): { success: boolean; message: string } => {
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
    const email = resetTokens.get(token);
    if (!email) return { success: false, message: 'Invalid or expired reset token.' };
    resetTokens.delete(token);
    setCredentials((prev) => {
      const next = { ...prev, [email]: newPassword };
      // Persist password change to the user row
      const user = users.find((u) => normalizeEmail(u.email) === email);
      if (user) db.upsertUser(user, newPassword).catch((e) => console.error('persist reset password:', e));
      return next;
    });
    return { success: true, message: 'Password reset successfully. You can now sign in.' };
  }, [resetTokens, users]);

  const registerUser = useCallback(async (user: User, password: string): Promise<void> => {
    setUsers((prev) => [...prev, user]);
    setCredentials((prev) => ({ ...prev, [normalizeEmail(user.email)]: password.trim() }));
    await db.upsertUser(user, password.trim());
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>, newPassword?: string): Promise<void> => {
    let updatedUser: User | undefined;
    setUsers((prev) => {
      const next = prev.map((u) => u.id === userId ? { ...u, ...updates } : u);
      updatedUser = next.find((u) => u.id === userId);
      return next;
    });
    if (updates.email) {
      const oldUser = users.find((u) => u.id === userId);
      if (oldUser && oldUser.email !== updates.email) {
        setCredentials((prev) => {
          const next = { ...prev };
          delete next[normalizeEmail(oldUser.email)];
          return next;
        });
      }
    }
    if (newPassword?.trim()) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setCredentials((prev) => ({ ...prev, [normalizeEmail(updates.email || user.email)]: newPassword.trim() }));
      }
    }
    if (updatedUser) {
      const pw = newPassword?.trim() || credentials[normalizeEmail(updatedUser.email)] || '';
      await db.upsertUser(updatedUser, pw);
    }
  }, [users, credentials]);

  const toggleUserStatus = useCallback(async (userId: string): Promise<void> => {
    let updatedUser: User | undefined;
    setUsers((prev) => {
      const next = prev.map((u) => u.id === userId ? { ...u, status: (u.status === 'active' ? 'inactive' : 'active') as User['status'] } : u);
      updatedUser = next.find((u) => u.id === userId);
      return next;
    });
    if (updatedUser) {
      const pw = credentials[normalizeEmail(updatedUser.email)] || '';
      await db.upsertUser(updatedUser, pw);
    }
  }, [credentials]);

  const getCredentials = useCallback(() => credentials, [credentials]);

  const restoreUsers = useCallback((restoredUsers: User[]) => {
    setUsers(restoredUsers);
    db.upsertUsers(restoredUsers, credentials).catch((e) => console.error('persist restoreUsers:', e));
  }, [credentials]);

  return (
    <AuthContext.Provider value={{
      currentUser, users, login, logout, forgotPassword, resetPassword, sessionTimeout,
      registerUser, updateUser, toggleUserStatus, getCredentials, setUsers, restoreUsers, loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
