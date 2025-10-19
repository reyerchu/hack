/**
 * Track Sponsor Feature - Type Definitions
 * 
 * 所有赞助商相关的类型定义
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 扩展的 Sponsor 类型
// ============================================================================

/**
 * 赞助层级
 */
export type SponsorTier = 'title' | 'track' | 'general';

/**
 * 联系人角色
 */
export type ContactRole = 'primary' | 'technical' | 'marketing';

/**
 * 联系人信息
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
 * 赞助商权限
 */
export interface SponsorPermissions {
  canEditTrackChallenge: boolean;  // 可否编辑赛道题目
  canViewSubmissions: boolean;     // 可否查看提交
  canJudge: boolean;               // 可否评审
  canContactTeams: boolean;        // 可否联系队伍
}

/**
 * 合约信息
 */
export interface SponsorContract {
  signedDate: Date | Timestamp;
  expiryDate: Date | Timestamp;
  documentUrl: string;
}

/**
 * 扩展的赞助商信息
 */
export interface ExtendedSponsor {
  id: string;
  
  // 基本信息
  name: string;
  logo: string;
  website: string;
  
  // 赞助层级
  tier: SponsorTier;
  sponsorshipAmount?: number;      // 可选，敏感信息
  
  // 赛道关联
  trackId?: string;
  trackName?: string;
  
  // 品牌素材
  brandKit?: BrandKit;
  
  // 联系人
  contacts: SponsorContact[];
  
  // 权限
  permissions: SponsorPermissions;
  
  // 合约
  contract?: SponsorContract;
  
  // 状态
  status: 'active' | 'inactive' | 'pending';
  
  // 元数据
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// 扩展的 Challenge 类型
// ============================================================================

/**
 * 奖金信息
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
 * 自定义提交字段
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
 * 挑战状态
 */
export type ChallengeStatus = 'draft' | 'published' | 'closed';

/**
 * 扩展的挑战信息
 */
export interface ExtendedChallenge {
  id: string;
  
  // 基本信息
  title: string;
  description: string;
  detailedDescription?: string;    // Markdown 格式
  
  // 赛道信息
  track: string;
  trackId: string;
  
  // 赞助商关联
  sponsorId: string;
  sponsorName: string;
  
  // 奖金
  prizes: ChallengePrize[];
  
  // 要求
  requirements: ChallengeRequirements;
  submissionRequirements: SubmissionRequirements;
  
  // 时间线
  timeline: ChallengeTimeline;
  
  // 附件
  attachments?: ChallengeAttachment[];
  
  // 状态和排序
  status: ChallengeStatus;
  rank: number;
  
  // 元数据
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// 队伍提交
// ============================================================================

/**
 * 队伍成员
 */
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'leader' | 'developer' | 'designer' | 'pm' | 'other';
}

/**
 * 提交状态
 */
export type SubmissionStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
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
 * 队伍提交
 */
export interface TeamSubmission {
  id: string;
  
  // 队伍信息
  teamName: string;
  teamMembers: TeamMember[];
  
  // 项目信息
  projectName: string;
  projectTrack: string;
  challengeId: string;
  oneLiner: string;                // max 140 chars
  description: string;
  
  // 提交内容
  githubRepo?: string;
  demoUrl?: string;
  presentationUrl?: string;
  documentationUrl?: string;
  
  // 自定义字段
  customFields?: {
    [fieldName: string]: string;
  };
  
  // 技术栈
  techStack: string[];
  
  // 状态
  status: SubmissionStatus;
  reviewNotes?: string;
  
  // 评分
  scores?: SubmissionScore[];
  averageScore?: number;
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
// 赞助商用户关联
// ============================================================================

/**
 * 赞助商用户角色
 */
export type SponsorUserRole = 'admin' | 'viewer' | 'judge';

/**
 * 赞助商用户映射
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
 * 赞助商活动类型
 */
export type SponsorActivityAction =
  | 'view_submission'
  | 'edit_challenge'
  | 'score_team'
  | 'update_track'
  | 'contact_team'
  | 'export_report';

/**
 * 赞助商活动日志
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
  
  timestamp: Date | Timestamp;
}

// ============================================================================
// 通知
// ============================================================================

/**
 * 赞助商通知类型
 */
export type SponsorNotificationType =
  | 'new_submission'
  | 'submission_updated'
  | 'judging_started'
  | 'judging_deadline'
  | 'results_announced'
  | 'team_contacted';

/**
 * 赞助商通知
 */
export interface SponsorNotification {
  id: string;
  recipientUserId: string;
  recipientEmail?: string;
  sponsorId: string;
  trackId: string;
  
  type: SponsorNotificationType;
  title: string;
  message: string;
  
  relatedSubmissionId?: string;
  relatedTeamId?: string;
  
  actionUrl?: string;
  
  isRead: boolean;
  createdAt: Date | Timestamp;
}

// ============================================================================
// 统计数据
// ============================================================================

/**
 * 赛道统计
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
// API 响应类型
// ============================================================================

/**
 * 通用 API 响应
 */
export interface ApiResponse<T = any> {
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
 * 赛道列表响应
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
 * 评审信息响应
 */
export interface JudgingInfoResponse {
  criteria: JudgingCriterion[];
  submissions: Array<{
    id: string;
    teamName: string;
    projectName: string;
    myScore?: SubmissionScore;     // 当前评审的评分
    averageScore?: number;
  }>;
}

