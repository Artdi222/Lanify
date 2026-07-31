/** User profile from the API */
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  createdAt?: string;
}

/** Admin user profile from the API (backward compat for admin panel) */
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: "admin" | "user";
}

/** Response from POST /auth/login */
export interface LoginResponse {
  token: string;
  user: User;
}
