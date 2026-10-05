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

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || response.statusText || 'An error occurred';
      throw new ApiError(response.status, errorMessage, data);
    }

    // Standard API response shape is often { success: true, data: T }
    // We'll return the raw data if it matches our shape or just the parsed JSON.
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data.data as T;
    }

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
