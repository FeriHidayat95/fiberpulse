import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('sanctum_token') || null,
  role: localStorage.getItem('user_role') || null,
  userName: localStorage.getItem('user_name') || null,

  setAuth: (token, role, userName) => {
    localStorage.setItem('sanctum_token', token);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', userName);
    set({ token, role, userName });
  },

  logout: () => {
    localStorage.removeItem('sanctum_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    set({ token: null, role: null, userName: null });
    window.location.href = '/';
  }
}));
