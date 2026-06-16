import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const TOKEN_KEY = '@app-cavazin:token';
const USER_KEY  = '@app-cavazin:user';

/**
 * Use sessionStorage instead of localStorage:
 * - Survives page refresh (F5) ✅
 * - Cleared when browser tab/window is closed ✅ (better isolation)
 * - Not shared across tabs ✅
 * - Not accessible by scripts from other origins ✅
 */
function loadFromSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: sessionStorage.getItem(TOKEN_KEY),
  user: loadFromSession<User>(USER_KEY),

  login: (token, user) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    // Also clear any leftover from old localStorage sessions
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));
