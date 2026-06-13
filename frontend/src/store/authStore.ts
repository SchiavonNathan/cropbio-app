import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('@app-cavazin:token'),
  login: (token, user) => {
    localStorage.setItem('@app-cavazin:token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('@app-cavazin:token');
    set({ token: null, user: null });
  },
}));
