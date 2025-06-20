# KOC X 粉丝专属兑换码领取应用

## 项目概述

本项目是一个单页应用 (Single-Page Application, SPA)，旨在为 X 平台（原 Twitter）上的一位意见领袖 (KOC) 向其粉丝分发专属兑换码。核心原则是为粉丝创造一个安全、公平、高互动性和个性化的体验。

该应用将验证用户是否为 KOC X 账号的关注者，然后才允许他们领取一个唯一的兑换码。整个体验应该像一个特别的线上活动，利用从 X API 获取的用户数据来创建一个个性化和动画化的界面。

本项目将使用现代化的全栈 JavaScript 框架构建，并部署在 Tencent Cloud EdgeOne 平台上。

## 核心用户流程与逻辑

应用必须处理两种主要的用户场景：

### 场景 A: 首次访问者

1. 用户进入首页。前端调用 `/api/me` 端点检查是否存在会话。API 返回 `loggedIn: false`。
2. UI 显示一个醒目的按钮："使用 X 登录以领取您的兑换码"。
3. 用户点击按钮，被重定向到 X OAuth 2.0 授权页面。
4. 用户授权应用。X 将他们重定向回应用的 `/api/callback` 端点。
5. `/api/callback` 函数处理 OAuth 流程，获取用户的 `access_token`，并通过设置一个安全的、HttpOnly 的 Cookie 为用户创建一个会话。然后它将用户重定向回首页 (`/`)。
6. 回到首页后，前端再次调用 `/api/me`。这次请求成功，并返回用户的 X 个人资料数据。
7. UI 动态更新为个性化的"已登录"状态（详见 UI/UX 部分）。用户现在可以继续领取他们的兑换码。

### 场景 B: 回访用户 (拥有有效会话)

1. 用户进入首页。前端调用 `/api/me`。
2. 请求中包含会话 Cookie。API 验证会话并返回 `loggedIn: true` 以及用户的 X 个人资料数据。
3. UI 立即渲染个性化的"已登录"状态，显示用户和 KOC 的个人信息。
4. 用户可以直接点击"领取我的兑换码"按钮来获取他们的兑换码，无需再次登录。

## 关键功能

- **X OAuth 2.0 认证**: 使用"带 PKCE 的授权码流程"进行安全的用户登录。
- **关注者验证**: 后端必须验证已认证的用户是否是指定 KOC X 账号的关注者。
- **唯一兑换码领取**: 每个 X 账号只能领取一个兑换码。系统必须防止重复领取。
- **动态与个性化 UI**: 登录后，UI 必须显示用户的 X 头像和用户名，并与 KOC 的信息并排展示。
- **交互式动画**: UI 应包含引人入胜的动画，以可视化粉丝与 KOC 之间的连接，并为兑换码"传输"过程制作动画。
- **会话管理**: 使用安全的 Cookie 维护用户会话，以获得无缝的回访体验。
- **API 驱动**: 前端是一个纯粹的 SPA，通过一组后端 Serverless 函数进行所有逻辑交互。

## 技术栈

- **前端框架**: Next.js (React)
  
  > **重要提示**: 项目需配置为静态导出 (`output: 'export'`)，因为部署目标 Tencent Cloud EdgeOne Pages 目前不支持 SSR 模式。

- **CSS 框架**: Tailwind CSS，用于快速和响应式的 UI 开发。
- **动画库**: GSAP (GreenSock Animation Platform)，用于高级动画，特别是 SVG 路径动画。
- **部署平台**: Tencent Cloud EdgeOne Pages。
- **后端**: Tencent Cloud EdgeOne Functions (作为 EdgeOne Pages 项目的一部分)。
  - 参考文档: https://edgeone.ai/document/162227908259442688
- **数据库**: Tencent Cloud EdgeOne KV Store。
  - 参考文档: https://edgeone.ai/document/162227803822321664

## 应用架构

### 前端页面/路由

- `/`: 主登陆页。根据用户的登录状态动态渲染。
- `/success`: 成功领取兑换码后显示的页面。应展示获取到的兑换码。
- `/error`: 用于各种错误情况的页面（例如，不是关注者、已领取、兑换码已领完）。应根据 URL 查询参数（例如 `?reason=not_a_follower`）显示用户友好的消息。

### 后端 API 端点 (EdgeOne Functions)

#### GET /api/me

- **目的**: 检查用户的当前登录状态。
- **逻辑**: 读取会话 Cookie。如果有效，从 KV 中检索会话数据并返回 `{ loggedIn: true, user: { id, name, username, profile_image_url } }`。如果无效或不存在，则返回 `{ loggedIn: false }`。

#### GET /api/callback

- **目的**: 处理来自 X 的 OAuth 回调。
- **逻辑**:
  1. 从 X 的重定向中接收 `code` 和 `state`。
  2. 通过调用 X API 的 token 端点，用 `code` 换取 `access_token`。
  3. 从 X API `GET /2/users/me` 获取用户个人资料。
  4. 创建一个新的会话 ID。
  5. 将包含加密的 `access_token` 和用户资料的会话数据存储在 EdgeOne KV 中，以会话 ID 为键。
  6. 在用户的浏览器中设置一个安全的、HttpOnly 的 Cookie，其值为会话 ID。
  7. 将用户重定向到首页 (`/`)。

#### POST /api/claim

- **目的**: 已认证用户领取兑换码的主要逻辑。
- **逻辑**:
  1. 通过 Cookie 验证用户会话。从 KV 的会话数据中检索用户 ID 和 `access_token`。
  2. 检查 `claimed_users` KV 存储，看 `claimed_user:<user_id>` 是否存在。如果存在，返回"已领取"错误。
  3. 使用存储的 `access_token` 调用 X API (`GET /2/users/:id/following`) 以验证用户是否关注了 KOC。如果不是，返回"不是关注者"错误。
  4. 如果所有检查都通过，从 KV 中获取可用兑换码列表（例如 `list({ prefix: 'code:' })`）。如果没有，返回"兑换码已领完"错误。
  5. 原子化地执行领取操作：
     - a. 挑选一个可用的兑换码键。
     - b. 从 `available_codes` 池中删除该兑换码键。
     - c. 在 `claimed_users` 池中添加一条记录：`put('claimed_user:<user_id>', '领取的兑换码')`。
  6. 返回包含已领取兑换码的成功 JSON 响应：`{ success: true, code: 'THE-CODE-123' }`。

### EdgeOne KV Store 数据模式

**设计思路**: 整个项目的所有数据将存储在同一个 KV 命名空间下。为了在逻辑上区分不同类型的数据（如兑换码、领取记录、会话），我们采用 Key 前缀的设计模式。这是一种在 KV 存储中既高效又易于管理的常见实践。

#### 可用兑换码池
- **键格式**: `code:<具体的兑换码>`
- **值**: `1` (或 `true`)
- **用途**: 用于存储可用的兑换码池。通过删除其键来"消耗"一个兑换码。

#### 已领取用户记录
- **键格式**: `claimed_user:<x_user_id>`
- **值**: 该用户收到的兑换码。
- **用途**: 用于快速 (O(1)) 检查用户是否已领取过兑换码。

#### 会话存储
- **键格式**: `session:<安全随机的会话ID>`
- **值**: 一个 JSON 字符串，包含 `{ accessToken: '加密后的access_token', userProfile: { ... } }`。
- **用途**: 在多次访问之间持久化用户登录会话。

## UI/UX 设计与动画

### 布局
已登录用户的主视图应为两列布局：
- **左侧卡片**: 显示已认证用户的 X 个人资料头像和用户名。
- **右侧卡片**: 显示 KOC 的 X 个人资料头像和用户名（这些可以硬编码或从环境变量传入）。

### "关注"状态可视化
在两张卡片之间，必须有一个视觉元素来确认关注关系：
- 一条 SVG 路径（直线或曲线）应连接两个个人资料卡片。
- 一个复选标记图标 (✅) 应显示在该路径上或附近。
- 当用户登录时，这整个元素应优雅地淡入。

### "兑换码传输"动画
当用户点击"领取我的兑换码"按钮时触发此动画：
- 使用 GSAP 的 MotionPathPlugin。
- 制作一个小 SVG 图标（例如一个点、一把钥匙、一个小 logo）沿 SVG 路径从 KOC 的卡片移动到用户的卡片的动画。
- 动画应平滑，持续约 1.5-2 秒。
- 在动画播放时，领取按钮应处于加载状态。

### 兑换码揭示
一旦 `/api/claim` 调用成功返回：
- 应显示领取的兑换码。
- 在用户的个人资料卡片下的指定区域，使用"打字机"或"解密"动画效果逐个字符地揭示兑换码。

## 环境变量

应用需要在 EdgeOne Pages 部署环境中设置以下环境变量：

```env
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=https://yourdomain.com/api/callback
KOC_X_USER_ID=target_koc_user_id
SESSION_SECRET=your_session_secret
NEXT_PUBLIC_KOC_USERNAME=@YourHandle
NEXT_PUBLIC_KOC_AVATAR_URL=https://example.com/avatar.jpg
```

### 环境变量说明

- `X_CLIENT_ID`: X 应用的 Client ID。
- `X_CLIENT_SECRET`: X 应用的 Client Secret。
- `X_REDIRECT_URI`: 指向 `/api/callback` 端点的完整 URL。
- `KOC_X_USER_ID`: 目标 KOC 的数字 X 用户 ID，用于检查关注关系。
- `SESSION_SECRET`: 用于签署/加密会话 Cookie 的秘密字符串。
- `NEXT_PUBLIC_KOC_USERNAME`: KOC 的 X 用户名 (例如 `@MyHandle`)。
- `NEXT_PUBLIC_KOC_AVATAR_URL`: KOC 头像图片的 URL。