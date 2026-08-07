const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  params?: Record<string, unknown>;
  /** Skip console error logging (for optional/non-critical requests). */
  quiet?: boolean;
  /** Number of retries on network failure (default 3). */
  retries?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError") ||
        error.message.includes("fetch")))
  );
}

/**
 * Custom fetch wrapper with query param serialization, retries, and error handling.
 */
export async function apiClient<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers, quiet = false, retries = 3, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((val) => searchParams.append(key, String(val)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const config: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...customConfig,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail;
        const message =
          errorData.message ||
          (typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: { msg?: string }) => d.msg).join(", ")
              : undefined) ||
          `API Error: ${response.status} ${response.statusText}`;
        throw new Error(message);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      lastError = error;
      const canRetry = isNetworkError(error) && attempt < retries - 1;
      if (canRetry) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (!quiet) {
        console.error(`[API Client Error] ${endpoint}:`, error);
      }
      throw error;
    }
  }

  if (!quiet) {
    console.error(`[API Client Error] ${endpoint}:`, lastError);
  }
  throw lastError;
}
