export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  discoveredCount: number;
}

const mockUser: User = {
  id: 'demo-user-1',
  email: 'explorer@sanskritsnap.org',
  username: 'heritage_explorer',
  fullName: 'Aarav Sharma',
  avatarUrl: undefined,
  xp: 1450,
  level: 4,
  discoveredCount: 12,
};

export const useAuthStore = () => {
  return {
    user: mockUser,
    isAuthenticated: true,
    login: (_email: string) => {},
    logout: () => {},
  };
};
