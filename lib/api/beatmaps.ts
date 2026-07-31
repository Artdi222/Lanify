import type { 
  Beatmap, 
  BeatmapListResponse, 
  CreateBeatmapPayload,
  CreateBeatmapBatchPayload 
} from "@/types/beatmap";
import { apiClient } from "./client";
import { useAuthStore } from "@/lib/store/useAuthStore";

/** Fetch paginated beatmap list */
export async function listBeatmaps(
  page: number = 1,
  limit: number = 20,
  token?: string | null,
  search?: string
): Promise<BeatmapListResponse> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
  return apiClient<BeatmapListResponse>(
    `/beatmaps?page=${page}&limit=${limit}${searchParam}`,
    { token }
  );
}

/** Fetch a single beatmap by ID */
export async function getBeatmap(
  id: string,
  token?: string | null
): Promise<Beatmap> {
  return apiClient<Beatmap>(`/beatmaps/${id}`, { token });
}

/** Create a new beatmap entry (metadata + file path) */
export async function createBeatmap(
  data: CreateBeatmapPayload,
  token: string
): Promise<Beatmap> {
  return apiClient<Beatmap>("/beatmaps", {
    method: "POST",
    body: data,
    token,
  });
}

/** Create multiple beatmaps at once */
export async function createBeatmapBatch(
  data: CreateBeatmapBatchPayload,
  token: string
): Promise<Beatmap[]> {
  return apiClient<Beatmap[]>("/beatmaps/batch", {
    method: "POST",
    body: data,
    token,
  });
}

/** Delete a beatmap by ID */
export async function deleteBeatmap(
  id: string,
  token: string
): Promise<void> {
  return apiClient<void>(`/beatmaps/${id}`, {
    method: "DELETE",
    token,
  });
}

/** Get signed download URL for a beatmap file */
export async function getBeatmapUrl(
  id: string,
  token: string
): Promise<{ url: string }> {
  return apiClient<{ url: string }>(`/beatmaps/${id}/url`, { token });
}

/**
 * Upload a file directly to Supabase Storage with progress tracking.
 * Uses XMLHttpRequest for progress events.
 */
export function uploadToSupabase(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const { token } = useAuthStore.getState();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error("Authentication required"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiUrl}/beatmaps/upload`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch {
        response = {};
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        // Since we are using XHR manually, we need to unwrap the Elysia successResponse
        resolve(response.data?.filePath || response.filePath);
      } else {
        const error = response.error || response.message || xhr.statusText;
        reject(new Error(`Upload failed: ${error}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed: Network error or CORS block"));
    xhr.send(formData);
  });
}

/**
 * Calculates star rating for all mania difficulties in an .osz file using the backend.
 */
export async function calculateStars(
  file: File,
  token: string
): Promise<Array<{ difficultyName: string, starRating: number }>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${apiUrl}/beatmaps/calculate-stars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error || json.message || `Calculate stars failed: ${response.statusText}`);
  }

  return json.data;
}
