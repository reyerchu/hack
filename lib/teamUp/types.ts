/**
 * 找隊友功能 - TypeScript 類型定義
 */

import type { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Enums and Constants Types
// ============================================================================

export type ProjectTrack =
  | 'DeFi'
  | 'NFT / 數位資產'
  | 'RWA 資產上鏈'
  | '穩定幣應用'
  | 'DAO / 治理'
  | '跨鏈技術'
  | '其他';

export type ProjectStage =
  | '還沒有想法'
  | '有想法，還沒動工'
  | '已開始，需要隊友'
  | '有 MVP，持續優化'
  | '準備完整，等待Demo';

export type TeamRole = '工程師' | '設計師' | '產品經理' | '市場行銷' | '其他';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// ============================================================================
// Database Models
// ============================================================================

/**
 * 找隊友需求
 */
export interface TeamNeed {
  id: string;
  ownerUserId: string;
  ownerEmail: string;
  ownerName: string;
  ownerNickname: string; // 發布人稱呼/暱稱

  // 公開資訊
  title: string;
  projectTrack: ProjectTrack;
  projectStage: ProjectStage;
  brief: string;
  rolesNeeded: string[];
  haveRoles: string[];
  otherNeeds?: string;

  // 私密資訊 (僅應徵者可見)
  contactHint: string;

  // 狀態管理
  isOpen: boolean;
  viewCount: number;
  applicationCount: number;

  // 審核標記
  isFlagged: boolean;
  flagReason?: string;
  isHidden: boolean;

  // 時間戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 應徵記錄
 */
export interface TeamApplication {
  id: string;
  teamNeedId: string;
  applicantUserId: string;
  applicantEmail: string;
  applicantName: string;

  // 應徵資訊
  roles: string[];
  message?: string;
  contactForOwner: string;

  // 狀態管理
  status: ApplicationStatus;
  isReadByOwner: boolean;

  // 審核標記
  isFlagged: boolean;

  // 時間戳
  createdAt: Timestamp;
  updatedAt: Timestamp;
  statusChangedAt?: Timestamp;
}

/**
 * 通知擴展 - 找隊友相關
 */
export type TeamUpNotificationType =
  | 'apply_received'
  | 'apply_accepted'
  | 'apply_rejected'
  | 'need_closed';

export interface TeamUpNotificationPayload {
  type: TeamUpNotificationType;
  teamNeedId: string;
  teamNeedTitle: string;
  applicationId?: string;
  applicantName?: string;
  ownerName?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * 創建需求 - Request
 */
export interface CreateTeamNeedRequest {
  title: string;
  projectTrack: ProjectTrack;
  projectStage: ProjectStage;
  brief: string;
  rolesNeeded: string[];
  haveRoles: string[];
  otherNeeds?: string;
  contactHint: string;
}

/**
 * 更新需求 - Request
 */
export interface UpdateTeamNeedRequest {
  title?: string;
  projectStage?: ProjectStage;
  brief?: string;
  rolesNeeded?: string[];
  haveRoles?: string[];
  otherNeeds?: string;
  contactHint?: string;
  isOpen?: boolean;
}

/**
 * 獲取需求列表 - Query Parameters
 */
export interface GetNeedsQueryParams {
  track?: ProjectTrack;
  stage?: ProjectStage;
  roles?: string[];
  search?: string;
  isOpen?: boolean;
  sort?: 'latest' | 'popular' | 'applications';
  limit?: number;
  offset?: number;
}

/**
 * 獲取需求列表 - Response
 */
export interface GetNeedsResponse {
  success: true;
  data: TeamNeed[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * 獲取單個需求 - Response
 */
export interface GetNeedResponse {
  success: true;
  data: TeamNeed & {
    isOwner?: boolean;
    applications?: TeamApplication[];
  };
}

/**
 * 創建應徵 - Request
 */
export interface CreateApplicationRequest {
  roles: string[];
  message?: string;
  contactForOwner: string;
  recaptchaToken: string;
}

/**
 * 創建應徵 - Response
 */
export interface CreateApplicationResponse {
  success: true;
  data: {
    applicationId: string;
    contactHint: string;
    message: string;
  };
}

/**
 * 更新應徵狀態 - Request
 */
export interface UpdateApplicationStatusRequest {
  status: 'accepted' | 'rejected';
}

/**
 * 獲取我的應徵 - Response Item
 */
export interface MyApplication {
  id: string;
  teamNeedId: string;
  teamNeedTitle: string;
  ownerName: string;
  roles: string[];
  message?: string;
  contactForOwner: string;
  contactHint: string;
  status: ApplicationStatus;
  createdAt: Timestamp;
  statusChangedAt?: Timestamp;
}

/**
 * 獲取統計數據 - Response
 */
export interface TeamUpStatsResponse {
  success: true;
  data: {
    totalNeeds: number;
    openNeeds: number;
    totalApplications: number;
    successfulMatches: number;
    popularTracks: Array<{
      track: ProjectTrack;
      count: number;
    }>;
    popularRoles: Array<{
      role: string;
      count: number;
    }>;
  };
}

// ============================================================================
// Frontend Form Types
// ============================================================================

/**
 * 創建/編輯需求表單數據
 */
export interface TeamNeedFormData {
  title: string;
  projectTrack: ProjectTrack | '';
  projectStage: ProjectStage | '';
  brief: string;
  rolesNeeded: string[];
  haveRoles: string[];
  otherNeeds: string;
  contactHint: string;
  isOpen?: boolean; // 可選：是否開放應徵（編輯時使用）
}

/**
 * 應徵表單數據
 */
export interface ApplicationFormData {
  roles: string[];
  message: string;
  contactForOwner: string;
}

/**
 * 表單驗證錯誤
 */
export interface FormValidationErrors {
  [field: string]: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * PII 檢測結果
 */
export interface PIIValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: 'email' | 'phone' | 'url' | 'socialMedia';
}

/**
 * 敏感內容檢測結果
 */
export interface ContentModerationResult {
  isFlagged: boolean;
  matchedKeywords: string[];
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * TeamUpCard 組件 Props
 */
export interface TeamUpCardProps {
  need: TeamNeed;
  onClick: () => void;
  showStatus?: boolean;
}

/**
 * TeamUpList 組件 Props
 */
export interface TeamUpListProps {
  needs: TeamNeed[];
  loading?: boolean;
  onNeedClick: (needId: string) => void;
  emptyMessage?: string;
}

/**
 * FilterPanel 組件 Props
 */
export interface FilterPanelProps {
  filters: GetNeedsQueryParams;
  onChange: (filters: GetNeedsQueryParams) => void;
  onReset: () => void;
}

/**
 * ApplicationList 組件 Props
 */
export interface ApplicationListProps {
  needId: string;
  applications: TeamApplication[];
  onStatusChange: (appId: string, status: 'accepted' | 'rejected') => Promise<void>;
  loading?: boolean;
}

/**
 * ApplicationCard 組件 Props
 */
export interface ApplicationCardProps {
  application: TeamApplication;
  onAccept?: () => void;
  onReject?: () => void;
  onWithdraw?: () => void;
  showActions?: boolean;
}

/**
 * NeedForm 組件 Props
 */
export interface NeedFormProps {
  initialData?: Partial<TeamNeedFormData>;
  onSubmit: (data: TeamNeedFormData) => Promise<void>;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

/**
 * ApplyModal 組件 Props
 */
export interface ApplyModalProps {
  need: TeamNeed;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contactHint: string) => void;
}

/**
 * RoleSelector 組件 Props
 */
export interface RoleSelectorProps {
  selected: string[];
  onChange: (roles: string[]) => void;
  availableRoles?: string[];
  maxSelection?: number;
  placeholder?: string;
}

// ============================================================================
// API Error Types
// ============================================================================

export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export type APIResponse<T> = T | APIError;

// ============================================================================
// Admin Types
// ============================================================================

/**
 * Admin 統計卡片數據
 */
export interface AdminTeamUpStats {
  totalNeeds: number;
  openNeeds: number;
  closedNeeds: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  flaggedNeeds: number;
  hiddenNeeds: number;
  successRate: number;
  avgApplicationsPerNeed: number;
}

/**
 * Admin 需求過濾器
 */
export interface AdminNeedFilter {
  flagged?: boolean;
  hidden?: boolean;
  track?: ProjectTrack;
  dateRange?: [Date | null, Date | null];
  ownerUserId?: string;
}

/**
 * Admin 操作日誌
 */
export interface AdminActionLog {
  id: string;
  adminUserId: string;
  adminName: string;
  action: 'hide' | 'show' | 'delete' | 'flag' | 'unflag';
  targetType: 'need' | 'application';
  targetId: string;
  reason?: string;
  timestamp: Timestamp;
}

// ============================================================================
// Email Template Types
// ============================================================================

/**
 * Email 模板數據 - 收到應徵 (給 Owner)
 */
export interface ApplyReceivedEmailData {
  ownerName: string;
  needTitle: string;
  applicantRoles: string;
  applicantMessage: string;
  applicantContact: string;
  manageLink: string;
}

/**
 * Email 模板數據 - 應徵已提交 (給 Applicant)
 */
export interface ApplySubmittedEmailData {
  applicantName: string;
  needTitle: string;
  contactHint: string;
  needLink: string;
  myApplicationsLink: string;
}

/**
 * Email 模板數據 - 應徵被接受 (給 Applicant)
 */
export interface ApplyAcceptedEmailData {
  applicantName: string;
  needTitle: string;
  ownerName: string;
  message: string;
  nextSteps: string;
}

/**
 * Email 模板數據 - 應徵被拒絕 (給 Applicant)
 */
export interface ApplyRejectedEmailData {
  applicantName: string;
  needTitle: string;
  message: string;
  browseLink: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * 分頁信息
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * 排序選項
 */
export type SortOption = {
  value: 'latest' | 'popular' | 'applications';
  label: string;
};

/**
 * Rate Limit 配置
 */
export interface RateLimitConfig {
  max: number;
  windowSeconds: number;
}

/**
 * 時間格式化選項
 */
export type TimeFormatOption = 'relative' | 'absolute' | 'both';
