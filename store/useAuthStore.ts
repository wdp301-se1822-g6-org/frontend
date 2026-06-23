import { axiosInstance } from '@/lib/axios';
import { User } from '@/types/auth';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  authUser: User | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  refreshAccessToken: () => Promise<string | null>;
  getUser: () => Promise<User | null>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      authUser: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setUser: (user) => set({ authUser: user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;

        try {
          const res = await axiosInstance.post('/auth/refresh', {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken, user } = res.data;
          set({
            accessToken,
            ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
            ...(user ? { authUser: user } : {}),
          });
          return accessToken;
        } catch (error) {
          set({ authUser: null, accessToken: null, refreshToken: null });
          throw error;
        }
      },

      getUser: async (): Promise<User | null> => {
        const token = get().accessToken;
        if (!token) return null;
        try {
          const res = await axiosInstance.get('/auth/me');
          const resData = res.data?.data || res.data || res;
          const fetchedUser = (resData?.user || resData) as User;

          if (fetchedUser && typeof fetchedUser === 'object') {
            const mergedUser = { ...get().authUser, ...fetchedUser };
            set({ authUser: mergedUser });
            return mergedUser;
          }
          return null;
        } catch (err) {
          if (
            (err as { response?: { status?: number } })?.response?.status ===
            401
          ) {
            set({ authUser: null, accessToken: null, refreshToken: null });
          }
          return null;
        }
      },
    }),

    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        authUser: state.authUser,
      }),
    },
  ),
);
