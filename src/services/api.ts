// =============================================================================
// API SERVICE - HTTP Client for Backend API
// =============================================================================

import { API_ENDPOINTS } from '../lib/constants';

class ApiService {
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '';
  private defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Generic fetch wrapper with error handling
  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const fullUrl = this.baseUrl + url;
      console.log(`Making API request to: ${fullUrl}`);
      
      // Set timeout for fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log(`Response status: ${response.status} for ${fullUrl}`);
      
      if (!response.ok) {
        // Try to parse error message
        try {
          const errorData = await response.json();
          console.error('API error details:', errorData);
          throw new Error(errorData.message || errorData.detail || `HTTP error ${response.status}`);
        } catch (jsonError) {
          throw new Error(`HTTP error ${response.status} for ${url}`);
        }
      }

      // Check if response is empty
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data as T;
      } else {
        return {} as T;
      }
    } catch (error) {
      // Handle network errors and timeouts
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      console.error(`API error for ${url}:`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  // POST request
  async post<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.fetchWithErrorHandling<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();