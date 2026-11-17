import { create } from "zustand";
import { User } from "../types";
import { api } from "../services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null, refreshToken?: string | null) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("access_token"),
  isLoading: true,

  setUser: (user) => set({ user }),

  setToken: (token, refreshToken) => {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    } else if (refreshToken === null) {
      localStorage.removeItem("refresh_token");
    }
    set({ token });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      const response = await api.get<User>("/auth/me");
      set({ user: response.data, isLoading: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, token: null, isLoading: false });
    }
  },

  hasPermission: (permissionCode: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.is_superuser) return true;

    for (const role of user.roles || []) {
      if (role.name === "Admin") return true;
      for (const perm of role.permissions || []) {
        if (perm.code === permissionCode) return true;
      }
    }
    return false;
  },
}));

