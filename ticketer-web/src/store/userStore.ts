import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar_url: string | null;
  auth_provider: string | null;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

interface UserState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'ticketer-auth',
    }
  )
);
