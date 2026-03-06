/**
 * API Client for LockerHub Webapp
 * Handles all HTTP requests to the Webapp API with automatic JWT authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

interface ApiError {
  status: string
  statusCode: number
  message: string
  code?: string
  errors?: Array<{
    field: string
    message: string
    value: unknown
  }>
}

interface ApiResponse<T = unknown> {
  data?: T
  error?: ApiError
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token)
    }
  }

  /**
   * Build headers with authorization
   */
  private getHeaders(customHeaders?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(customHeaders)) {
        customHeaders.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, customHeaders)
      }
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      const error: ApiError = isJson
        ? await response.json()
        : {
          status: 'error',
          statusCode: response.status,
          message: response.statusText || 'An error occurred',
        }

      // Handle unauthorized - redirect to login
      if (response.status === 401) {
        this.removeToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }

      // Handle forbidden
      if (response.status === 403) {
        throw new Error(error.message || 'Access forbidden')
      }

      throw new Error(error.message || 'Request failed')
    }

    if (isJson) {
      return response.json()
    }

    // For non-JSON responses, return as unknown and let caller handle
    return response.text() as unknown as T
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders(options?.headers),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  /**
   * Request without authentication (for login, etc.)
   */
  async publicRequest<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    return this.handleResponse<T>(response)
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export the class for testing or creating new instances
export { ApiClient }

// Type exports
export type { ApiError, ApiResponse }
