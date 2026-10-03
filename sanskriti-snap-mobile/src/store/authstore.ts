import { create } from 'zustand';

import { apiRequest } from '@/services/api';
import type { Profile } from '@/types/backend';

export type AppUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  imageUrl?: string;
};

type AuthState = {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (user: AppUser | null) => void;
  fetchProfile: (userId?: string) => Promise<void>;
  setSignOut: (signOut: () => Promise<void>) => void;
  signOut: () => Promise<void>;
};

let signOutHandler: (() => Promise<void>) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setSession: (user) => set({ user, loading: false, ...(user ? {} : { profile: null }) }),
  fetchProfile: async () => {
    const profile = await apiRequest<Profile>('/me');
    set({ profile });
  },
  setSignOut: (handler) => {
    signOutHandler = handler;
  },
  signOut: async () => {
    if (!signOutHandler) throw new Error('Authentication is not initialized.');
    await signOutHandler();
    set({ user: null, profile: null, loading: false });
  },
}));
