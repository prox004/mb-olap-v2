"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/apiClient";

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "Staff";
  store: string;
  created_at: string;
}

export interface AuthUser {
  id?: string;
  role: "Manager" | "Staff";
  name: string;
  email?: string;
  store?: string;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  staffAccounts: StaffAccount[];
  isLoadingStaff: boolean;
  loginAsManager: () => Promise<{ success: boolean; message?: string }>;
  loginAsStaff: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  createStaffAccount: (data: { name: string; email: string; password: string; store: string }) => Promise<{ success: boolean; message?: string }>;
  registerAndLoginStaff: (data: { name: string; email: string; password: string; store?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteStaffAccount: (staffId: string) => Promise<{ success: boolean; message?: string }>;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "mb_auth_user";
const LOCAL_STORAGE_STAFF_KEY = "mb_staff_accounts";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState<boolean>(false);

  // 1. Initialize user from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === "Manager" || parsed.role === "Staff")) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        // No authenticated session found: user must sign in on the login page first
        setUser(null);
      }
    } catch (e) {
      console.warn("Failed to read user from localStorage", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch staff accounts from backend
  const refreshStaff = useCallback(async () => {
    try {
      setIsLoadingStaff(true);
      const res = await apiClient<{ success: boolean; data: StaffAccount[] }>("/auth/staff");
      if (res && res.success && Array.isArray(res.data)) {
        setStaffAccounts(res.data);
        localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn("Using offline cached staff list", err);
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
        if (cached) {
          setStaffAccounts(JSON.parse(cached));
        }
      } catch {}
    } finally {
      setIsLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    refreshStaff();
  }, [refreshStaff]);

  // 3. Manager Login: One-click instant login stored as "Manager"
  const loginAsManager = async () => {
    try {
      const managerUser: AuthUser = {
        role: "Manager",
        name: "Retail Operations Manager",
        email: "manager@mbaazar.in",
        store: "Headquarters (All Outlets)",
        token: "mgr-token-session",
      };

      try {
        const res = await apiClient<{ success: boolean; data: AuthUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ role: "Manager" }),
          headers: { "Content-Type": "application/json" },
        });
        if (res && res.data) {
          managerUser.name = res.data.name || managerUser.name;
        }
      } catch (apiErr) {
        console.warn("Backend login ping skipped, continuing with local session:", apiErr);
      }

      setUser(managerUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(managerUser));
      router.push("/");
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || "Manager login failed." };
    }
  };

  // 4. Staff Login: Email & Password verification against manager-created accounts
  const loginAsStaff = async (email: string, pass: string) => {
    try {
      if (!email.trim() || !pass.trim()) {
        return { success: false, message: "Please enter both Email and Password." };
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      // Try backend first
      try {
        const res = await apiClient<{ success: boolean; message: string; data: AuthUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            role: "Staff",
            email: cleanEmail,
            password: cleanPass,
          }),
          headers: { "Content-Type": "application/json" },
        });

        if (res && res.success && res.data) {
          const staffUser: AuthUser = {
            id: res.data.id,
            role: "Staff",
            name: res.data.name,
            email: res.data.email,
            store: res.data.store,
            token: res.data.token,
          };
          setUser(staffUser);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(staffUser));
          router.push("/");
          return { success: true, message: res.message };
        }
      } catch (apiErr: any) {
        // Fallback to locally loaded staff list
        const matched = staffAccounts.find(
          (acc) => acc.email.trim().toLowerCase() === cleanEmail && acc.password === cleanPass
        );

        if (matched) {
          const staffUser: AuthUser = {
            id: matched.id,
            role: "Staff",
            name: matched.name,
            email: matched.email,
            store: matched.store,
          };
          setUser(staffUser);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(staffUser));
          router.push("/");
          return { success: true, message: `Welcome back, ${matched.name}!` };
        }

        return {
          success: false,
          message: apiErr.message || "Invalid staff credentials. Please check your email/password or ask your Manager to add your account in Settings.",
        };
      }

      return {
        success: false,
        message: "Invalid staff credentials. Please check with your Manager.",
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Staff login failed." };
    }
  };

  // 5. Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    router.push("/signin");
  };

  // 6. Create Staff Account (Manager only)
  const createStaffAccount = async (data: { name: string; email: string; password: string; store: string }) => {
    try {
      const res = await apiClient<{ success: boolean; message: string; data: StaffAccount }>("/auth/staff", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (res && res.success) {
        await refreshStaff();
        return { success: true, message: res.message || "Staff account created successfully!" };
      } else {
        return { success: false, message: res?.message || "Failed to create staff account." };
      }
    } catch (err: any) {
      return { success: false, message: err.message || "Error creating staff account." };
    }
  };

  // 7. Register and Login Staff (from Sign In / Register page)
  const registerAndLoginStaff = async (data: { name: string; email: string; password: string; store?: string }) => {
    try {
      const createRes = await createStaffAccount({
        name: data.name,
        email: data.email,
        password: data.password,
        store: data.store || "All Outlets",
      });
      if (!createRes.success) {
        return createRes;
      }
      return await loginAsStaff(data.email, data.password);
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to register staff account." };
    }
  };

  // 8. Delete Staff Account (Manager only)
  const deleteStaffAccount = async (staffId: string) => {
    try {
      const res = await apiClient<{ success: boolean; message: string }>(`/auth/staff/${staffId}`, {
        method: "DELETE",
      });

      if (res && res.success) {
        await refreshStaff();
        return { success: true, message: res.message || "Staff account deleted successfully!" };
      } else {
        return { success: false, message: res?.message || "Failed to delete staff account." };
      }
    } catch (err: any) {
      return { success: false, message: err.message || "Error deleting staff account." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        staffAccounts,
        isLoadingStaff,
        loginAsManager,
        loginAsStaff,
        registerAndLoginStaff,
        logout,
        createStaffAccount,
        deleteStaffAccount,
        refreshStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
