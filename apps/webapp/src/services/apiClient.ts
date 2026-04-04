/**
 * API Client for LockerHub Webapp
 * Handles all HTTP requests to the Webapp API with automatic JWT authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

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
  private isRefreshing = false
  private refreshPromise: Promise<string> | null = null

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
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken()

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          throw new Error('Failed to refresh token')
        }

        const data = await response.json()
        const newAccessToken = data.accessToken

        this.setToken(newAccessToken)

        return newAccessToken
      } catch (error) {
        this.removeToken()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
        throw error
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response, isRetry = false): Promise<T> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    if (!response.ok) {
      let errorMessage = response.statusText || 'An error occurred'

      if (isJson) {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      }

      // Handle 401 with automatic token refresh
      if (response.status === 401 && !isRetry) {
        throw new Error('UNAUTHORIZED')
      }

      if (response.status === 403) {
        throw new Error(errorMessage)
      }

      throw new Error(errorMessage)
    }

    if (isJson) {
      return response.json()
    }

    return response.text() as unknown as T
  }

  /**
   * Generic request method with automatic token refresh
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    isRetry = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(options?.headers),
      })

      return await this.handleResponse<T>(response, isRetry)
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED' && !isRetry) {
        try {
          await this.refreshAccessToken()
          return this.request<T>(endpoint, options, true)
        } catch {
          throw error
        }
      }

      throw error
    }
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
   * Request without authentication
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

export const apiClient = new ApiClient(API_BASE_URL)

export type { ApiError, ApiResponse }
