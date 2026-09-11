import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'resolv-auth',
      onRehydrateStorage: () => (state) => {
        if (!state?.token && typeof window !== 'undefined') {
          try {
            const legacy = localStorage.getItem('trackly-auth');
            if (legacy) {
              const parsed = JSON.parse(legacy);
              if (parsed?.state?.token) {
                state.login(parsed.state.user, parsed.state.token);
              }
            }
          } catch (e) {
            // ignore
          }
        }
      },
    }
  )
);

export default useAuthStore;