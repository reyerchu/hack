/**
 * Track Sponsor Feature - Firestore Collections
 * 
 * 所有赞助商相关的 Firestore collection 名称
 */

export const SPONSOR_COLLECTIONS = {
  // 现有的（保持兼容）
  SPONSORS: '/sponsors',
  CHALLENGES: '/challenges',
  
  // 新增的
  EXTENDED_SPONSORS: '/extended-sponsors',
  EXTENDED_CHALLENGES: '/extended-challenges',
  TEAM_SUBMISSIONS: '/team-submissions',
  JUDGING_CRITERIA: '/judging-criteria',
  SPONSOR_USER_MAPPINGS: '/sponsor-user-mappings',
  SPONSOR_ACTIVITY_LOGS: '/sponsor-activity-logs',
  SPONSOR_NOTIFICATIONS: '/sponsor-notifications',
  TRACK_STATS: '/track-stats',
} as const;

/**
 * Collection 名称类型
 */
export type SponsorCollectionName = typeof SPONSOR_COLLECTIONS[keyof typeof SPONSOR_COLLECTIONS];

