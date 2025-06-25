export const APP_CONFIG = {
  name: 'KOC X 粉丝专属兑换码',
  description: '为 X 平台粉丝分发专属兑换码的应用',
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userUrl: 'https://api.twitter.com/2/users/me',
    scope: 'users.read',
  },
  koc: {
    userId: '552491458',
    name: 'MapleShaw',
    username: '@msjiaozhu', 
    avatarUrl: '/koc-avatar.png',
  },
} as const 