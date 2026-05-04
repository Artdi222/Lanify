import type { AdminUser, LoginResponse } from "@/types/user";
import { apiClient } from "./client";

/** Login with email and password, returns JWT token + user */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/** Verify current user via token, returns user profile */
export async function getMe(token: string): Promise<AdminUser> {
  return apiClient<AdminUser>("/auth/me", { token });
}
