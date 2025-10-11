/**
 * 找隊友功能 - 常量配置
 */

import { ProjectTrack, ProjectStage, TeamRole, RateLimitConfig } from './types';

// ============================================================================
// Enums - 業務常量
// ============================================================================

/**
 * 專案賽道
 */
export const PROJECT_TRACKS: ProjectTrack[] = [
  'DeFi',
  'NFT / 數位資產',
  'RWA 資產上鏈',
  '穩定幣應用',
  'DAO / 治理',
  '跨鏈技術',
  '其他',
];

/**
 * 專案階段
 */
export const PROJECT_STAGES: ProjectStage[] = [
  '還沒有想法',
  '有想法，還沒動工',
  '已開始，需要隊友',
  '有 MVP，持續優化',
  '準備完整，等待Demo',
];

/**
 * 團隊角色（簡化版本 - 5 大類，用於列表頁面篩選）
 */
export const TEAM_ROLES: TeamRole[] = ['工程師', '設計師', '產品經理', '市場行銷', '其他'];

/**
 * 詳細團隊角色（用於創建/編輯需求）
 */
export const DETAILED_TEAM_ROLES = [
  '工程師',
  '全端工程師',
  '前端工程師',
  '後端工程師',
  '智能合約工程師',
  'UI/UX 設計師',
  '產品經理',
  '市場行銷',
  '商業分析',
  '其他',
] as const;

/**
 * 應徵狀態
 */
export const APPLICATION_STATUSES = {
  PENDING: 'pending' as const,
  ACCEPTED: 'accepted' as const,
  REJECTED: 'rejected' as const,
  WITHDRAWN: 'withdrawn' as const,
};

/**
 * 應徵狀態標籤
 */
export const APPLICATION_STATUS_LABELS = {
  pending: '待審核',
  accepted: '已接受',
  rejected: '已拒絕',
  withdrawn: '已撤回',
};

/**
 * 應徵狀態顏色
 */
export const APPLICATION_STATUS_COLORS = {
  pending: 'yellow',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'gray',
};

// ============================================================================
// 驗證規則
// ============================================================================

/**
 * 字段長度限制
 */
export const FIELD_LIMITS = {
  TITLE_MAX: 100,
  BRIEF_MAX: 400,
  OTHER_NEEDS_MAX: 200,
  CONTACT_HINT_MAX: 60,
  MESSAGE_MAX: 280,
  CONTACT_FOR_OWNER_MAX: 120,
  FLAG_REASON_MAX: 200,
};

/**
 * 數量限制
 */
export const QUANTITY_LIMITS = {
  MIN_ROLES: 1,
  MAX_ROLES: 10,
  MAX_HAVE_ROLES: 10,
  MAX_TEAM_SIZE: 5,
  MIN_TEAM_SIZE: 2,
};

/**
 * PII 檢測模式
 */
export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/,
  url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  socialMedia: /\b(line|telegram|discord|wechat|tg|dc|ig|fb)[\s:@]?\w+/gi,
};

/**
 * PII 類型標籤
 */
export const PII_TYPE_LABELS = {
  email: 'Email',
  phone: '電話',
  url: '網址',
  socialMedia: '社交帳號',
};

/**
 * 敏感關鍵詞
 */
export const SENSITIVE_KEYWORDS = [
  '保證獲獎',
  '包賺',
  '投資理財',
  '融資',
  '代幣發行',
  '私募',
  '白名單',
  'airdrop',
  '空投',
  '傳銷',
  '詐騙',
  '賭博',
  '色情',
  '暴力',
];

// ============================================================================
// Rate Limiting 配置
// ============================================================================

/**
 * Rate Limit 規則
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  createNeed: { max: 3, windowSeconds: 86400 }, // 3次/天
  updateNeed: { max: 10, windowSeconds: 3600 }, // 10次/小時
  apply: { max: 3, windowSeconds: 600 }, // 3次/10分鐘
  flag: { max: 5, windowSeconds: 3600 }, // 5次/小時
  view: { max: 30, windowSeconds: 3600 }, // 30次/小時
};

/**
 * Rate Limit 錯誤訊息
 */
export const RATE_LIMIT_MESSAGES = {
  createNeed: '每日最多發布 3 個找隊友需求',
  updateNeed: '更新過於頻繁，請稍後再試',
  apply: '應徵過於頻繁，請稍後再試',
  flag: '標記過於頻繁，請稍後再試',
  view: '瀏覽過於頻繁，請稍後再試',
};

// ============================================================================
// API 配置
// ============================================================================

/**
 * 分頁默認值
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 20,
  MAX_LIMIT: 50,
  OFFSET: 0,
};

/**
 * 排序選項
 */
export const SORT_OPTIONS = [
  { value: 'latest' as const, label: '最新發布' },
  { value: 'popular' as const, label: '最多瀏覽' },
  { value: 'applications' as const, label: '最多應徵' },
];

/**
 * 排序字段映射
 */
export const SORT_FIELD_MAP = {
  latest: 'updatedAt',
  popular: 'viewCount',
  applications: 'applicationCount',
};

// ============================================================================
// 通知配置
// ============================================================================

/**
 * 通知類型
 */
export const NOTIFICATION_TYPES = {
  APPLY_RECEIVED: 'apply_received' as const,
  APPLY_ACCEPTED: 'apply_accepted' as const,
  APPLY_REJECTED: 'apply_rejected' as const,
  NEED_CLOSED: 'need_closed' as const,
};

/**
 * 通知標題模板
 */
export const NOTIFICATION_TITLE_TEMPLATES = {
  apply_received: '收到新的隊友應徵',
  apply_accepted: '您的應徵已被接受',
  apply_rejected: '您的應徵未通過',
  need_closed: '需求已關閉',
};

/**
 * Email 主題模板
 */
export const EMAIL_SUBJECT_TEMPLATES = {
  apply_received: '[RWA Hackathon] 收到新的隊友應徵',
  apply_submitted: '[RWA Hackathon] 已投遞：「{{needTitle}}」',
  apply_accepted: '[RWA Hackathon] 好消息！您的應徵已被接受',
  apply_rejected: '[RWA Hackathon] 關於您的應徵',
  need_closed: '[RWA Hackathon] 找隊友需求已關閉',
};

// ============================================================================
// UI 配置
// ============================================================================

/**
 * 賽道圖標映射 (使用 emoji 或 icon 名稱)
 */
export const TRACK_ICONS: Record<ProjectTrack, string> = {
  DeFi: '💰',
  'NFT / 數位資產': '🎨',
  'RWA 資產上鏈': '🏢',
  穩定幣應用: '💵',
  'DAO / 治理': '🗳️',
  跨鏈技術: '🌉',
  其他: '🔧',
};

/**
 * 賽道顏色 (Tailwind 類名)
 */
export const TRACK_COLORS: Record<ProjectTrack, string> = {
  DeFi: 'bg-blue-100 text-blue-800',
  'NFT / 數位資產': 'bg-purple-100 text-purple-800',
  'RWA 資產上鏈': 'bg-green-100 text-green-800',
  穩定幣應用: 'bg-yellow-100 text-yellow-800',
  'DAO / 治理': 'bg-pink-100 text-pink-800',
  跨鏈技術: 'bg-indigo-100 text-indigo-800',
  其他: 'bg-gray-100 text-gray-800',
};

/**
 * 階段圖標
 */
export const STAGE_ICONS: Record<ProjectStage, string> = {
  還沒有想法: '🔍',
  '有想法，還沒動工': '💡',
  '已開始，需要隊友': '🚀',
  '有 MVP，持續優化': '🔧',
  '準備完整，等待Demo': '🎯',
};

/**
 * 角色圖標（簡化版本）
 */
export const ROLE_ICONS: Record<TeamRole, string> = {
  工程師: '👨‍💻',
  設計師: '🎨',
  產品經理: '📊',
  市場行銷: '📣',
  其他: '🔧',
};

/**
 * 詳細角色圖標
 */
export const DETAILED_ROLE_ICONS: Record<string, string> = {
  工程師: '👨‍💻',
  全端工程師: '💻',
  前端工程師: '🖥️',
  後端工程師: '⚙️',
  智能合約工程師: '⛓️',
  'UI/UX 設計師': '🎨',
  產品經理: '📊',
  市場行銷: '📣',
  商業分析: '📈',
  其他: '🔧',
};

// ============================================================================
// 錯誤訊息
// ============================================================================

/**
 * API 錯誤代碼
 */
export const ERROR_CODES = {
  // 認證相關
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_REGISTERED: 'NOT_REGISTERED',
  USER_NOT_REGISTERED: 'NOT_REGISTERED', // Alias for consistency

  // HTTP
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',

  // 驗證相關
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PII_DETECTED: 'PII_DETECTED',
  INVALID_ENUM: 'INVALID_ENUM',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',
  FIELD_REQUIRED: 'FIELD_REQUIRED',

  // 業務邏輯
  NEED_NOT_FOUND: 'NEED_NOT_FOUND',
  APPLICATION_NOT_FOUND: 'APPLICATION_NOT_FOUND',
  ALREADY_APPLIED: 'ALREADY_APPLIED',
  DUPLICATE_APPLICATION: 'ALREADY_APPLIED', // Alias
  CANNOT_APPLY_OWN: 'CANNOT_APPLY_OWN',
  NEED_CLOSED: 'NEED_CLOSED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_REACHED: 'DAILY_LIMIT_REACHED',

  // reCAPTCHA
  RECAPTCHA_FAILED: 'RECAPTCHA_FAILED',

  // 服務器錯誤
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
};

/**
 * 錯誤訊息模板
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: '未認證，請先登入',
  [ERROR_CODES.FORBIDDEN]: '無權限執行此操作',
  [ERROR_CODES.NOT_REGISTERED]: '請先完成報名',
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 'HTTP 方法不允許',
  [ERROR_CODES.NOT_FOUND]: '資源不存在',
  [ERROR_CODES.VALIDATION_ERROR]: '資料驗證失敗',
  [ERROR_CODES.PII_DETECTED]: '公開欄位建議勿包含個人聯繫資訊等個資',
  [ERROR_CODES.INVALID_ENUM]: '選項不在允許範圍內',
  [ERROR_CODES.FIELD_TOO_LONG]: '字數超過限制',
  [ERROR_CODES.FIELD_REQUIRED]: '此欄位為必填',
  [ERROR_CODES.NEED_NOT_FOUND]: '需求不存在',
  [ERROR_CODES.APPLICATION_NOT_FOUND]: '應徵記錄不存在',
  [ERROR_CODES.ALREADY_APPLIED]: '您已經應徵過此需求',
  [ERROR_CODES.CANNOT_APPLY_OWN]: '不能應徵自己的需求',
  [ERROR_CODES.NEED_CLOSED]: '此需求已關閉',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '操作過於頻繁，請稍後再試',
  [ERROR_CODES.DAILY_LIMIT_REACHED]: '已達到每日發布上限',
  [ERROR_CODES.RECAPTCHA_FAILED]: 'reCAPTCHA 驗證失敗',
  [ERROR_CODES.INTERNAL_ERROR]: '服務器錯誤，請稍後再試',
  [ERROR_CODES.DATABASE_ERROR]: '數據庫錯誤',
  [ERROR_CODES.EMAIL_SEND_FAILED]: 'Email 發送失敗',
};

// ============================================================================
// 其他配置
// ============================================================================

/**
 * 環境變數鍵名
 */
export const ENV_KEYS = {
  RECAPTCHA_SECRET: 'RECAPTCHA_SECRET_KEY',
  REDIS_URL: 'REDIS_URL',
  BASE_URL: 'NEXT_PUBLIC_BASE_URL',
  EMAIL_FROM: 'EMAIL_FROM',
  SENDGRID_API_KEY: 'SENDGRID_API_KEY',
};

/**
 * Firestore Collection 名稱
 */
export const COLLECTIONS = {
  TEAM_NEEDS: 'teamNeeds',
  TEAM_APPLICATIONS: 'teamApplications',
  NOTIFICATIONS: 'notifications',
  USERS: 'users',
  ADMIN_LOGS: 'adminLogs',
};

/**
 * 時間常量 (毫秒)
 */
export const TIME_CONSTANTS = {
  ONE_MINUTE: 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
};

/**
 * GA4 事件名稱
 */
export const GA4_EVENTS = {
  VIEW_TEAM_UP_LIST: 'view_team_up_list',
  VIEW_TEAM_UP_DETAIL: 'view_team_up_detail',
  CREATE_TEAM_NEED: 'create_team_need',
  UPDATE_TEAM_NEED: 'update_team_need',
  APPLY_TEAM_NEED: 'apply_team_need',
  ACCEPT_APPLICATION: 'accept_application',
  REJECT_APPLICATION: 'reject_application',
  WITHDRAW_APPLICATION: 'withdraw_application',
  CLOSE_TEAM_NEED: 'close_team_need',
  FLAG_CONTENT: 'flag_content',
  SEARCH_TEAM_UP: 'search_team_up',
  FILTER_TEAM_UP: 'filter_team_up',
};

/**
 * 本地存儲鍵名
 */
export const LOCAL_STORAGE_KEYS = {
  DRAFT_NEED: 'teamup_draft_need',
  RECENT_SEARCHES: 'teamup_recent_searches',
  FILTER_PREFERENCES: 'teamup_filter_prefs',
};

/**
 * Toast 消息持續時間 (毫秒)
 */
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 2000,
  WARNING: 4000,
};

/**
 * 空狀態訊息
 */
export const EMPTY_STATE_MESSAGES = {
  NO_NEEDS: '目前沒有找隊友需求',
  NO_APPLICATIONS: '尚無應徵記錄',
  NO_MY_NEEDS: '您還沒有發布找隊友需求',
  NO_MY_APPLICATIONS: '您還沒有應徵任何需求',
  NO_SEARCH_RESULTS: '沒有符合搜尋條件的結果',
  NO_FILTER_RESULTS: '沒有符合篩選條件的結果',
};

/**
 * 預設頭像 URL
 */
export const DEFAULT_AVATAR_URL = '/assets/default-avatar.png';

/**
 * 功能開關 (Feature Flags)
 */
export const FEATURE_FLAGS = {
  ENABLE_CHAT: false, // 即時聊天功能
  ENABLE_RECOMMENDATION: false, // 推薦算法
  ENABLE_DRAFT_SAVE: true, // 草稿保存
  ENABLE_EMAIL_NOTIFICATIONS: true, // Email 通知
  ENABLE_PUSH_NOTIFICATIONS: false, // 推送通知
  ENABLE_CONTENT_MODERATION: true, // 內容審核
};
