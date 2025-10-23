/**
 * Track Sponsor Feature - Complete Implementation Plan
 *
 * 本文件是可执行的 TypeScript spec，定义了所有需要实现的数据结构、API 和页面
 */

// ============================================================================
// PHASE 1: 数据模型设计
// ============================================================================

/**
 * 扩展的 Sponsor 类型 - 包含完整的赞助商信息
 */
type ExtendedSponsor = {
  id: string;

  // 基本信息
  name: string; // 赞助商名称
  logo: string; // Logo URL
  website: string; // 官网链接

  // 赞助层级和权限
  tier: 'title' | 'track' | 'general'; // 冠名 | 赛道 | 一般赞助
  sponsorshipAmount?: number; // 赞助金额（可选，敏感信息）

  // 赛道关联
  trackId?: string; // 关联的赛道 ID（若为赛道赞助商）
  trackName?: string; // 赛道名称

  // 品牌素材
  brandKit?: {
    logo: string;
    banner: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };

  // 联系人
  contacts: {
    name: string;
    email: string;
    role: string; // 'primary' | 'technical' | 'marketing'
  }[];

  // 权限设置
  permissions: {
    canEditTrackChallenge: boolean; // 可否编辑赛道题目
    canViewSubmissions: boolean; // 可否查看提交
    canJudge: boolean; // 可否评审
    canContactTeams: boolean; // 可否联系队伍
  };

  // 合约信息
  contract?: {
    signedDate: Date;
    expiryDate: Date;
    documentUrl: string;
  };

  // 元数据
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'pending';
};

/**
 * 扩展的 Challenge 类型 - 与 Sponsor 关联
 */
type ExtendedChallenge = {
  id: string;

  // 基本信息
  title: string;
  description: string;
  detailedDescription?: string; // Markdown 格式的详细说明

  // 赛道信息
  track: string; // 赛道名称 (e.g., "RWA Tokenization")
  trackId: string; // 赛道唯一标识

  // 赞助商关联
  sponsorId: string; // 赞助商 ID
  sponsorName: string; // 赞助商名称

  // 奖金设置
  prizes: {
    rank: number; // 1, 2, 3...
    title: string; // "第一名"、"最佳创意奖"
    amount: number; // 奖金金额
    currency: string; // "USD" | "TWD"
    description?: string; // 奖品说明
  }[];

  // 技术要求
  requirements: {
    frameworks?: string[]; // 必须使用的技术框架
    apis?: string[]; // 必须使用的 API
    constraints?: string[]; // 其他限制条件
  };

  // 提交要求
  submissionRequirements: {
    requireGithubRepo: boolean;
    requireDemo: boolean;
    requirePresentation: boolean;
    requireDocumentation: boolean;
    customFields?: {
      name: string;
      type: 'text' | 'url' | 'file';
      required: boolean;
    }[];
  };

  // 时间线
  timeline: {
    announcementDate: Date;
    submissionStart: Date;
    submissionDeadline: Date;
    judgingDate: Date;
    resultsDate: Date;
  };

  // 附件
  attachments?: {
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'link';
  }[];

  // 状态和排序
  status: 'draft' | 'published' | 'closed';
  rank: number;

  // 元数据
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 队伍提交 - 黑客松项目提交
 */
type TeamSubmission = {
  id: string;

  // 队伍信息
  teamName: string;
  teamMembers: {
    userId: string;
    name: string;
    email: string;
    role: string; // 'leader' | 'developer' | 'designer' | 'pm'
  }[];

  // 项目信息
  projectName: string;
  projectTrack: string; // 参赛赛道
  challengeId: string; // 挑战赛 ID
  oneLiner: string; // 一句话简介 (max 140 chars)
  description: string; // 详细描述

  // 提交内容
  githubRepo?: string;
  demoUrl?: string;
  presentationUrl?: string;
  documentationUrl?: string;

  // 自定义字段（根据 Challenge 的 submissionRequirements）
  customFields?: {
    [fieldName: string]: string;
  };

  // 技术栈
  techStack: string[];

  // 审核状态
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  reviewNotes?: string;

  // 评分（由评审填写）
  scores?: {
    judgeId: string;
    judgeName: string;
    scores: {
      [criteriaName: string]: number; // e.g., "innovation": 8
    };
    totalScore: number;
    comments?: string;
    submittedAt: Date;
  }[];

  averageScore?: number;
  finalRank?: number;

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
};

/**
 * 评审标准模板
 */
type JudgingCriteria = {
  id: string;
  challengeId: string;

  criteria: {
    name: string;
    description: string;
    maxScore: number; // e.g., 10
    weight: number; // 权重 0-1
  }[];

  createdAt: Date;
};

/**
 * 赞助商与用户的关联 - 用于权限控制
 */
type SponsorUserMapping = {
  id: string;
  sponsorId: string;
  userId: string;
  role: 'admin' | 'viewer' | 'judge';

  createdAt: Date;
};

/**
 * 赞助商活动日志 - Audit Trail
 */
type SponsorActivityLog = {
  id: string;
  sponsorId: string;
  userId: string;
  userName: string;

  action: string; // 'view_submission' | 'edit_challenge' | 'score_team' | ...
  targetType: string; // 'submission' | 'challenge' | 'team' | ...
  targetId: string;

  details?: any; // 操作详情

  timestamp: Date;
};

// ============================================================================
// PHASE 2: 数据库 Collections
// ============================================================================

const FIRESTORE_COLLECTIONS = {
  // 现有的
  SPONSORS: '/sponsors', // 需要迁移到 extended-sponsors
  CHALLENGES: '/challenges', // 需要迁移到 extended-challenges
  REGISTRATIONS: '/registrations',

  // 新增的
  EXTENDED_SPONSORS: '/extended-sponsors',
  EXTENDED_CHALLENGES: '/extended-challenges',
  TEAM_SUBMISSIONS: '/team-submissions',
  JUDGING_CRITERIA: '/judging-criteria',
  SPONSOR_USER_MAPPINGS: '/sponsor-user-mappings',
  SPONSOR_ACTIVITY_LOGS: '/sponsor-activity-logs',
};

// ============================================================================
// PHASE 3: 权限系统
// ============================================================================

/**
 * 检查用户是否有赞助商权限
 */
async function checkSponsorPermission(userId: string, sponsorId: string): Promise<boolean> {
  // 1. 检查是否是 super_admin 或 admin
  // 2. 检查是否在 sponsor-user-mappings 中
  // 3. 返回权限结果
  return false; // placeholder
}

/**
 * 检查用户是否可以访问特定赛道
 */
async function checkTrackAccess(userId: string, trackId: string): Promise<boolean> {
  // 1. 获取用户的赞助商关联
  // 2. 检查赞助商是否赞助此赛道
  // 3. 返回访问权限
  return false; // placeholder
}

/**
 * 获取用户可访问的赛道列表
 */
async function getUserAccessibleTracks(userId: string): Promise<string[]> {
  // 返回用户作为赞助商可以访问的所有赛道 ID
  return []; // placeholder
}

// ============================================================================
// PHASE 4-6: API Endpoints 设计
// ============================================================================

/**
 * API: /api/sponsor/tracks
 *
 * GET - 获取赞助商的赛道列表
 * POST - 创建新赛道（仅 admin）
 * PUT - 更新赛道信息
 */

/**
 * API: /api/sponsor/tracks/[trackId]/challenge
 *
 * GET - 获取赛道的挑战题目
 * POST - 创建新挑战（赞助商有权限时）
 * PUT - 更新挑战题目
 * DELETE - 删除挑战
 */

/**
 * API: /api/sponsor/tracks/[trackId]/submissions
 *
 * GET - 获取该赛道的所有队伍提交
 *   - Query params: status, sortBy, limit, offset
 *   - 返回分页结果
 */

/**
 * API: /api/sponsor/submissions/[submissionId]
 *
 * GET - 获取单个提交的详细信息
 * PUT - 更新提交状态（仅评审）
 */

/**
 * API: /api/sponsor/judging/[trackId]
 *
 * GET - 获取评审标准和队伍列表
 * POST - 提交评分
 */

/**
 * API: /api/sponsor/stats/[trackId]
 *
 * GET - 获取赛道统计数据
 *   - 返回：报名数、提交数、完成率、参与者分布等
 */

/**
 * API: /api/sponsor/reports/[trackId]
 *
 * GET - 生成并下载报告（PDF/CSV）
 *   - Query params: format (pdf|csv), type (summary|detailed)
 */

// ============================================================================
// PHASE 7-11: 页面路由
// ============================================================================

const SPONSOR_PAGES = {
  // Phase 7: 增强的仪表板
  DASHBOARD: '/sponsor',

  // Phase 8: 赛道管理
  TRACKS: '/sponsor/tracks',
  TRACK_DETAIL: '/sponsor/tracks/[trackId]',
  TRACK_CHALLENGE_EDIT: '/sponsor/tracks/[trackId]/challenge',

  // Phase 9: 队伍提交查看
  SUBMISSIONS: '/sponsor/submissions',
  SUBMISSION_DETAIL: '/sponsor/submissions/[submissionId]',

  // Phase 10: 评审决选
  JUDGING: '/sponsor/judging/[trackId]',
  JUDGING_RESULTS: '/sponsor/judging/[trackId]/results',

  // Phase 11: 报告分析
  REPORTS: '/sponsor/reports/[trackId]',

  // 通用
  SETTINGS: '/sponsor/settings',
};

// ============================================================================
// PHASE 12: 通知系统
// ============================================================================

type SponsorNotificationType =
  | 'new_submission' // 新队伍提交
  | 'submission_updated' // 队伍更新提交
  | 'judging_started' // 评审阶段开始
  | 'judging_deadline' // 评审截止提醒
  | 'results_announced' // 结果公布
  | 'team_contacted'; // 队伍联系通知

type SponsorNotification = {
  id: string;
  recipientUserId: string;
  sponsorId: string;
  trackId: string;

  type: SponsorNotificationType;
  title: string;
  message: string;

  relatedSubmissionId?: string;
  relatedTeamId?: string;

  actionUrl?: string; // 点击后跳转的链接

  isRead: boolean;
  createdAt: Date;
};

// ============================================================================
// 实现优先级和依赖关系
// ============================================================================

/**
 * 实现顺序（考虑依赖关系）：
 *
 * Sprint 1: 数据基础（1-3 天）
 *   - Phase 1: 数据模型设计 ✓
 *   - Phase 2: 数据库 Schema 创建 ✓
 *   - Phase 3: 权限系统实现 ✓
 *
 * Sprint 2: 赛道管理（3-5 天）
 *   - Phase 4: 赛道管理 API
 *   - Phase 8: 赛道管理前端页面
 *
 * Sprint 3: 提交查看（3-5 天）
 *   - Phase 5: 提交查看 API
 *   - Phase 9: 提交查看前端页面
 *
 * Sprint 4: 评审功能（3-5 天）
 *   - Phase 6: 评审 API
 *   - Phase 10: 评审前端页面
 *
 * Sprint 5: 仪表板和报告（2-3 天）
 *   - Phase 7: 增强仪表板
 *   - Phase 11: 报告页面
 *
 * Sprint 6: 通知和优化（2-3 天）
 *   - Phase 12: 通知系统
 *   - 性能优化
 *   - 测试和修复
 *
 * 总计：约 16-24 天（2.5-4 周）
 */

// ============================================================================
// 技术栈和工具
// ============================================================================

const TECH_STACK = {
  frontend: {
    framework: 'Next.js + React',
    styling: 'Tailwind CSS',
    stateManagement: 'React Hooks + Context API',
    charts: 'recharts', // 用于统计图表
    fileUpload: 'react-dropzone', // 用于文件上传
    richText: 'react-markdown', // 用于 Markdown 显示
  },

  backend: {
    api: 'Next.js API Routes',
    database: 'Firebase Firestore',
    storage: 'Firebase Storage', // 用于文件存储
    auth: 'Firebase Auth',
    functions: 'Firebase Functions', // 用于复杂计算（可选）
  },

  export: {
    pdf: 'jsPDF', // 生成 PDF 报告
    csv: 'papaparse', // 生成 CSV 导出
  },
};

// ============================================================================
// 安全性考虑
// ============================================================================

const SECURITY_CHECKLIST = {
  dataIsolation: {
    description: '赞助商只能访问自己赛道的数据',
    implementation: [
      '在所有 API 中检查 trackId 权限',
      '使用 Firestore Security Rules 加固',
      '前端也要做权限判断（防止 UI 泄露）',
    ],
  },

  piiProtection: {
    description: '保护参赛者个人信息',
    implementation: [
      '不向赞助商暴露完整的联系方式（除非参赛者同意）',
      '只显示队伍信息，不显示个人详细资料',
      '记录所有数据访问日志（Audit Trail）',
    ],
  },

  auditTrail: {
    description: '记录所有操作',
    implementation: [
      '每次查看提交时记录日志',
      '每次评分时记录日志',
      '每次编辑挑战时记录日志',
      'Admin 可查看完整的操作历史',
    ],
  },
};

// ============================================================================
// 测试计划
// ============================================================================

const TEST_SCENARIOS = {
  permissions: [
    '赞助商 A 不能访问赞助商 B 的赛道',
    '非赞助商用户无法访问 /sponsor 页面',
    'Admin 可以访问所有赛道',
  ],

  workflow: [
    '赞助商登入 → 查看仪表板 → 查看提交 → 打分 → 查看报告',
    '赞助商上传挑战题目 → Admin 审核 → 发布',
    '队伍提交项目 → 赞助商收到通知 → 查看提交',
  ],

  edge_cases: [
    '赞助商访问不存在的 trackId',
    '队伍在截止日期后提交',
    '赞助商尝试评审非自己赛道的项目',
    '多个赞助商同时编辑同一挑战',
  ],
};

export type {
  ExtendedSponsor,
  ExtendedChallenge,
  TeamSubmission,
  JudgingCriteria,
  SponsorUserMapping,
  SponsorActivityLog,
  SponsorNotificationType,
  SponsorNotification,
};

export { FIRESTORE_COLLECTIONS, SPONSOR_PAGES, TECH_STACK, SECURITY_CHECKLIST, TEST_SCENARIOS };
