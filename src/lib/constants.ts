export const APP_CONFIG = {
  name: 'KOC X 粉丝专属兑换码',
  description: '为 X 平台粉丝分发专属兑换码的应用',
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userUrl: 'https://api.twitter.com/2/users/me',
    followingUrl: 'https://api.twitter.com/2/users/{id}/following',
    scope: 'users.read follows.read',
  },
  session: {
    cookieName: 'eo-session',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  kv: {
    prefixes: {
      codes: 'code:',
      claimedUsers: 'claimed_user:',
      sessions: 'session:',
    },
  },
  ui: {
    animationDuration: 2000, // 2 seconds for code transfer animation
    revealDelay: 300, // delay between each character reveal
  },
} as const

export const API_ENDPOINTS = {
  me: '/api/me',
  callback: '/api/callback',
  claim: '/api/claim',
} as const

export const ROUTES = {
  home: '/',
  success: '/success',
  error: '/error',
} as const

export const ERROR_REASONS = {
  notFollower: 'not_a_follower',
  alreadyClaimed: 'already_claimed',
  noCodesLeft: 'no_codes_left',
  authError: 'auth_error',
} as const 