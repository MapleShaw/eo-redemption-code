export interface XUser {
  id: string
  name: string
  username: string
  profile_image_url: string
}

export interface SessionData {
  accessToken: string
  userProfile: XUser
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthCheckResponse {
  loggedIn: boolean
  user?: XUser
}

export interface ClaimResponse {
  success: boolean
  code?: string
  error?: string
} 