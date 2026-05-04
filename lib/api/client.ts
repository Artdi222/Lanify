const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/**
 * Typed fetch wrapper for the ElysiaJS backend.
 * Handles JSON serialization, auth headers, and error responses.
 */
export async function apiClient<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    token?: string | null;
  } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? json.message ?? `API error: ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return json.data as T;
}
