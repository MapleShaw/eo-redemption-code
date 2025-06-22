import type { AuthCheckResponse, ClaimResponse } from '@/types/user'
import { getApiUrl } from './utils'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = getApiUrl(endpoint)
  
  try {
    const response = await fetch(url, {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // Ignore JSON parse errors
      }
      throw new ApiError(errorMessage, response.status)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network error', 0)
  }
}

export const authApi = {
  async checkAuth(): Promise<AuthCheckResponse> {
    return fetchApi<AuthCheckResponse>('/me')
  },

  async claimCode(): Promise<ClaimResponse> {
    return fetchApi<ClaimResponse>('/claim', {
      method: 'POST',
    })
  },

  getLoginUrl(): string {
    return getApiUrl('/auth/login')
  },
}

export { fetchApi } 