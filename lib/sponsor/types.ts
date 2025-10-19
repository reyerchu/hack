/**
 * Track Sponsor Feature - Type Definitions
 * 
 * 所有贊助商相關的類型定義
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// 擴展的 Sponsor 類型
// ============================================================================

/**
 * 赞助层级
 */
export type SponsorTier = 'title' | 'track' | 'general';

/**
 * 聯繫人角色
 */
export type ContactRole = 'primary' | 'technical' | 'marketing';

/**
 * 聯繫人資訊
 */
export interface SponsorContact {
  name: string;
  email: string;
  role: ContactRole;
}

/**
 * 品牌套件
 */
export interface BrandKit {
  logo: string;                    // Logo URL
  banner: string;                  // Banner URL
  colors: {
    primary: string;               // 主色
    secondary: string;             // 辅助色
  };
}

/**
 * 贊助商權限
 */
export interface SponsorPermissions {
  canEditTrackChallenge: boolean;  // 可否編輯賽道题目
  canViewSubmissions: boolean;     // 可否查看提交
  canJudge: boolean;               // 可否评审
  canContactTeams: boolean;        // 可否联系隊伍
}

/**
 * 合約資訊
 */
export interface SponsorContract {
  signedDate: Date | Timestamp;
  expiryDate: Date | Timestamp;
  documentUrl: string;
}

/**
 * 擴展的贊助商資訊
 */
export interface ExtendedSponsor {
  id: string;
  
  // 基本資訊
  name: string;
  logo: string;
  website: string;
  
  // 赞助层级
  tier: SponsorTier;
  sponsorshipAmount?: number;      // 可选，敏感資訊
  
  // 賽道關聯
  trackId?: string;
  trackName?: string;
  
  // 品牌素材
  brandKit?: BrandKit;
  
  // 聯繫人
  contacts: SponsorContact[];
  
  // 權限
  permissions: SponsorPermissions;
  
  // 合約
  contract?: SponsorContract;
  
  // 狀態
  status: 'active' | 'inactive' | 'pending';
  
  // 元數據
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// 擴展的 Challenge 類型
// ============================================================================

/**
 * 獎金資訊
 */
export interface ChallengePrize {
  rank: number;                    // 1, 2, 3...
  title: string;                   // "第一名"、"最佳创意奖"
  amount: number;
  currency: 'USD' | 'TWD';
  description?: string;
}

/**
 * 技术要求
 */
export interface ChallengeRequirements {
  frameworks?: string[];           // 必须使用的技术框架
  apis?: string[];                 // 必须使用的 API
  constraints?: string[];          // 其他限制条件
}

/**
 * 自定義提交字段
 */
export interface CustomSubmissionField {
  name: string;
  type: 'text' | 'url' | 'file';
  required: boolean;
  placeholder?: string;
  description?: string;
}

/**
 * 提交要求
 */
export interface SubmissionRequirements {
  requireGithubRepo: boolean;
  requireDemo: boolean;
  requirePresentation: boolean;
  requireDocumentation: boolean;
  customFields?: CustomSubmissionField[];
}

/**
 * 时间线
 */
export interface ChallengeTimeline {
  announcementDate: Date | Timestamp;
  submissionStart: Date | Timestamp;
  submissionDeadline: Date | Timestamp;
  judgingDate: Date | Timestamp;
  resultsDate: Date | Timestamp;
}

/**
 * 附件
 */
export interface ChallengeAttachment {
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'link';
}

/**
 * 挑戰狀態
 */
export type ChallengeStatus = 'draft' | 'published' | 'closed';

/**
 * 擴展的挑戰資訊
 */
export interface ExtendedChallenge {
  id: string;
  
  // 基本資訊
  title: string;
  description: string;
  detailedDescription?: string;    // Markdown 格式
  
  // 賽道資訊
  track: string;
  trackId: string;
  
  // 贊助商關聯
  sponsorId: string;
  sponsorName: string;
  
  // 獎金
  prizes: ChallengePrize[];
  prizeDetails?: string;           // 獎金詳情描述（简化版）
  
  // 要求
  requirements: ChallengeRequirements;
  submissionRequirements: SubmissionRequirements;
  
  // 评分标准（简化版）
  evaluationCriteria?: Array<{
    name: string;
    weight: number;
  }>;
  
  // 参考资源
  resources?: Array<{
    title: string;
    url: string;
  }>;
  
  // 时间线
  timeline: ChallengeTimeline;
  
  // 附件
  attachments?: ChallengeAttachment[];
  challengeBriefUrl?: string;      // 挑戰简报 PDF URL
  
  // 品牌素材
  brandAssets?: {
    logoUrl?: string;
    kvImageUrl?: string;
  };
  
  // 狀態和排序
  status: ChallengeStatus;
  rank: number;
  
  // 元數據
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// 隊伍提交
// ============================================================================

/**
 * 隊伍成员
 */
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'leader' | 'developer' | 'designer' | 'pm' | 'other';
}

/**
 * 提交狀態
 */
export type SubmissionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review'
  | 'shortlisted'
  | 'winner'
  | 'accepted' 
  | 'rejected';

/**
 * 评分
 */
export interface SubmissionScore {
  judgeId: string;
  judgeName: string;
  scores: {
    [criteriaName: string]: number;  // e.g., "innovation": 8
  };
  totalScore: number;
  comments?: string;
  submittedAt: Date | Timestamp;
}

/**
 * 隊伍提交
 */
export interface TeamSubmission {
  id: string;
  
  // 隊伍資訊
  teamName: string;
  teamMembers: TeamMember[];
  
  // 項目資訊
  projectName: string;
  projectTrack: string;
  trackId: string;
  challengeId: string;
  oneLiner: string;                // max 140 chars
  description: string;
  projectDescription?: string;
  
  // 提交内容
  githubRepo?: string;
  demoUrl?: string;
  videoUrl?: string;
  presentationUrl?: string;
  documentationUrl?: string;
  
  // 自定義字段
  customFields?: {
    [fieldName: string]: string;
  };
  
  // 技术栈
  techStack: string[];
  tags?: string[];
  
  // 狀態
  status: SubmissionStatus;
  reviewNotes?: string;
  isRecommended?: boolean;
  
  // 评分
  scores?: SubmissionScore[];
  criteriaScores?: Record<string, number>;
  averageScore?: number;
  finalScore?: number;
  finalRank?: number;
  
  // 时间戳
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  submittedAt?: Date | Timestamp;
}

// ============================================================================
// 评审标准
// ============================================================================

/**
 * 评审标准项
 */
export interface JudgingCriterion {
  name: string;
  description: string;
  maxScore: number;                // e.g., 10
  weight: number;                  // 权重 0-1
}

/**
 * 评审标准
 */
export interface JudgingCriteria {
  id: string;
  challengeId: string;
  criteria: JudgingCriterion[];
  createdAt: Date | Timestamp;
}

// ============================================================================
// 贊助商用戶關聯
// ============================================================================

/**
 * 贊助商用戶角色
 */
export type SponsorUserRole = 'admin' | 'viewer' | 'judge';

/**
 * 贊助商用戶映射
 */
export interface SponsorUserMapping {
  id: string;
  sponsorId: string;
  userId: string;
  role: SponsorUserRole;
  createdAt: Date | Timestamp;
}

// ============================================================================
// 活动日志
// ============================================================================

/**
 * 贊助商活动類型
 */
export type SponsorActivityAction =
  | 'view_submission'
  | 'edit_challenge'
  | 'update_challenge'
  | 'score_team'
  | 'score_submission'
  | 'update_track'
  | 'contact_team'
  | 'export_report'
  | 'download_report'
  | 'other';

/**
 * 贊助商活动日志
 */
export interface SponsorActivityLog {
  id: string;
  sponsorId: string;
  userId: string;
  userName: string;
  
  action: SponsorActivityAction;
  targetType: string;              // 'submission' | 'challenge' | 'team'
  targetId: string;
  
  details?: any;
  metadata?: {
    trackName?: string;
    [key: string]: any;
  };
  
  timestamp: Date | Timestamp;
}

// ============================================================================
// 通知
// ============================================================================

/**
 * 贊助商通知類型
 */
export type SponsorNotificationType =
  | 'new_submission'
  | 'submission_updated'
  | 'submission_update'
  | 'judging_started'
  | 'judging_deadline'
  | 'deadline_reminder'
  | 'results_announced'
  | 'team_contacted';

/**
 * 贊助商通知
 */
export interface SponsorNotification {
  id: string;
  recipientId: string;             // 主要用於 API (等同 recipientUserId)
  recipientUserId: string;
  recipientEmail?: string;
  sponsorId: string;
  trackId: string;
  
  type: SponsorNotificationType;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  
  relatedSubmissionId?: string;
  relatedTeamId?: string;
  
  actionUrl?: string;
  
  isRead: boolean;
  readAt?: Date | Timestamp;
  createdAt: Date | Timestamp;
}

// ============================================================================
// 統計數據
// ============================================================================

/**
 * 賽道統計
 */
export interface TrackStats {
  trackId: string;
  trackName: string;
  
  submissionCount: number;
  teamCount: number;
  participantCount: number;
  
  averageScore?: number;
  completionRate: number;          // 0-1
  
  participantDistribution: {
    byUniversity?: {[university: string]: number};
    byMajor?: {[major: string]: number};
    byExperience?: {[level: string]: number};
  };
  
  techStackUsage: {
    [techName: string]: number;    // 使用次数
  };
  
  updatedAt: Date | Timestamp;
}

// ============================================================================
// API 响应類型
// ============================================================================

/**
 * 通用 API 响应類型
 */
export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 賽道列表响应
 */
export interface TrackListResponse {
  tracks: Array<{
    id: string;
    name: string;
    sponsorId: string;
    sponsorName: string;
    challenge?: ExtendedChallenge;
    stats: {
      submissionCount: number;
      teamCount: number;
      averageScore?: number;
    };
  }>;
}

/**
 * 提交列表项（简化版）
 */
export interface SubmissionListItem {
  id: string;
  teamName: string;
  projectName: string;
  oneLiner: string;
  status: SubmissionStatus;
  submittedAt?: Date | Timestamp;
  averageScore?: number;
  rank?: number;
}

/**
 * 评审資訊响应
 */
export interface JudgingInfoResponse {
  criteria: JudgingCriterion[];
  submissions: Array<{
    id: string;
    teamName: string;
    projectName: string;
    myScore?: SubmissionScore;     // 當前评审的评分
    averageScore?: number;
  }>;
}

