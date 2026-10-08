export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

/** UUID v4 for idempotency keys. crypto.randomUUID only exists on HTTPS/localhost, so fall back to getRandomValues. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const SESSION_EXPIRED_EVENT = 'session-expired';
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again to continue.';

/** Turns the various error body shapes (string, Zod issue array, {message}) into one readable message. */
function errorMessageFrom(data: any, fallback: string): string {
  const raw = data?.error ?? data?.message;
  if (typeof raw === 'string' && raw) return raw;
  if (Array.isArray(raw) && raw.length) {
    return raw.map((i: any) => (typeof i === 'string' ? i : i?.message)).filter(Boolean).join('; ') || fallback;
  }
  if (typeof data === 'string' && data && data.length < 200) return data;
  return fallback;
}

export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    let data;
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.status === 401 && !url.startsWith('/api/auth/')) {
      // Let the dashboard show its re-login prompt; the caller keeps its form state.
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError(401, SESSION_EXPIRED_MESSAGE, data);
    }

    if (!response.ok) {
      throw new ApiError(response.status, errorMessageFrom(data, response.statusText || 'An error occurred'), data);
    }

    // Return the parsed JSON directly so callers can check .success and .data

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parsing errors
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string, options?: RequestInit) => fetchApi<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body: any, options?: RequestInit) => 
    fetchApi<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any, options?: RequestInit) => 
    fetchApi<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any, options?: RequestInit) => 
    fetchApi<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => fetchApi<T>(url, { ...options, method: 'DELETE' }),
};
