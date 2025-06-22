export interface XOAuthTokenResponse {
  token_type: string
  expires_in: number
  access_token: string
  scope: string
  refresh_token?: string
}

export interface XOAuthConfig {
  client_id: string
  client_secret: string
  redirect_uri: string
  response_type: 'code'
  scope: string
  state: string
  code_challenge?: string
  code_challenge_method?: 'S256'
}

export interface XUserResponse {
  data: {
    id: string
    name: string
    username: string
    profile_image_url: string
  }
}

export interface XFollowingResponse {
  data?: Array<{
    id: string
    name: string
    username: string
  }>
  meta?: {
    result_count: number
  }
} 