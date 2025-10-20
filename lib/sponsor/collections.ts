/**
 * Track Sponsor Feature - Firestore Collections
 * 
 * 所有贊助商相關的 Firestore collection 名称
 */

export const SPONSOR_COLLECTIONS = {
  // 现有的（保持兼容）
  SPONSORS: '/sponsors',
  CHALLENGES: '/challenges',
  
  // 新增的
  TRACKS: '/tracks',
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
 * Collection 名称類型
 */
export type SponsorCollectionName = typeof SPONSOR_COLLECTIONS[keyof typeof SPONSOR_COLLECTIONS];

// 常用的單獨導出，方便使用
export const SPONSOR_NOTIFICATIONS = SPONSOR_COLLECTIONS.SPONSOR_NOTIFICATIONS;
export const TEAM_SUBMISSIONS = SPONSOR_COLLECTIONS.TEAM_SUBMISSIONS;
export const EXTENDED_CHALLENGES = SPONSOR_COLLECTIONS.EXTENDED_CHALLENGES;
export const EXTENDED_SPONSORS = SPONSOR_COLLECTIONS.EXTENDED_SPONSORS;
