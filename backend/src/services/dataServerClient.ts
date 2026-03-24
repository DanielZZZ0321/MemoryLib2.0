/**
 * Client for communicating with the external data processing & storage server.
 * Configure via environment variable: DATA_SERVER_URL
 */

const DATA_SERVER_URL = process.env.DATA_SERVER_URL || '';

export interface DataServerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class DataServerClient {
  private baseUrl: string;

  constructor(baseUrl: string = DATA_SERVER_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Strip trailing slash
  }

  async checkConnection(): Promise<boolean> {
    if (!this.baseUrl) return false;
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Forward a GET request to the data server
   */
  async get<T = unknown>(path: string): Promise<DataServerResponse<T>> {
    return this.request<T>('GET', path);
  }

  /**
   * Forward a POST request to the data server
   */
  async post<T = unknown>(path: string, body?: unknown): Promise<DataServerResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Forward a PUT request to the data server
   */
  async put<T = unknown>(path: string, body?: unknown): Promise<DataServerResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * Forward a DELETE request to the data server
   */
  async delete<T = unknown>(path: string): Promise<DataServerResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<DataServerResponse<T>> {
    if (!this.baseUrl) {
      return {
        success: false,
        error: 'DATA_SERVER_URL is not configured',
      };
    }

    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (body !== undefined && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Data server returned ${res.status}`,
        };
      }

      return { success: true, data: data as T };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reach data server',
      };
    }
  }
}

export const dataServerClient = new DataServerClient();
