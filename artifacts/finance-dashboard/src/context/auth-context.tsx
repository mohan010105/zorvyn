import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "coffer_users";
const SESSION_KEY = "coffer_session";

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash)}_${password.length}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session) as AuthUser;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 600));
    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() &&
             u.passwordHash === hashPassword(password)
    );
    if (!found) {
      throw new Error("Invalid email or password. Please try again.");
    }
    const authUser: AuthUser = { id: found.id, fullName: found.fullName, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const signup = async (fullName: string, email: string, password: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 700));
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 600));
    const users = getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) {
      throw new Error("No account found with that email address.");
    }
    users[idx].passwordHash = hashPassword(newPassword);
    saveUsers(users);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
