export type UserRole = 'admin' | 'editor' | 'expert' | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
} 