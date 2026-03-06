/**
 * Authentication Service
 * Handles login, logout, token refresh, and user session management
 */

import { apiClient } from './apiClient'

interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
  }
}

interface RefreshResponse {
  accessToken: string
}

interface User {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
}

class AuthService {
  private readonly AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3003'

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Login failed',
      }))
      throw new Error(error.message || 'Login failed')
    }

    const data: LoginResponse = await response.json()

    // Store tokens
    apiClient.setToken(data.accessToken)
    apiClient.setRefreshToken(data.refreshToken)

    // Store user info
    this.setUser(data.user)

    return data
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken()
      if (refreshToken) {
        // Call logout endpoint to invalidate refresh token
        await fetch(`${this.AUTH_SERVICE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear tokens and user info
      apiClient.removeToken()
      this.removeUser()
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${this.AUTH_SERVICE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Token refresh failed',
      }))
      throw new Error(error.message || 'Token refresh failed')
    }

    const data: RefreshResponse = await response.json()

    // Update access token
    apiClient.setToken(data.accessToken)

    return data.accessToken
  }

  /**
   * Get refresh token from localStorage
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  }

  /**
   * Get current user from localStorage
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null

    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  /**
   * Set user in localStorage
   */
  private setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  }

  /**
   * Remove user from localStorage
   */
  private removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('accessToken')
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUser()
    return user?.role === role
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin')
  }
}

// Create and export singleton instance
export const authService = new AuthService()

// Export the class
export { AuthService }

// Type exports
export type { LoginCredentials, LoginResponse, User }
