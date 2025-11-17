/**
 * Cache Invalidation Helper
 *
 * This module provides utilities to invalidate caches when data is updated.
 * It ensures that public pages reflect the latest data immediately after edits.
 */

import memoryCache from './memoryCache';

export type CacheTarget =
  | { type: 'team'; teamId: string }
  | { type: 'user'; userId: string }
  | { type: 'track'; trackId: string }
  | { type: 'challenge'; challengeId: string }
  | { type: 'winner' }
  | { type: 'tracks-all' };

/**
 * Invalidate cache for a specific resource
 */
export function invalidateCache(target: CacheTarget): boolean {
  try {
    let cacheKey: string;

    switch (target.type) {
      case 'team':
        cacheKey = `team:public:${target.teamId}`;
        break;
      case 'user':
        cacheKey = `user:public:${target.userId}`;
        break;
      case 'track':
        cacheKey = `track:public:${target.trackId}`;
        break;
      case 'challenge':
        cacheKey = `challenge:public:${target.challengeId}`;
        break;
      case 'winner':
        cacheKey = 'winners:all';
        break;
      case 'tracks-all':
        cacheKey = 'tracks:all';
        break;
      default:
        console.error('[CacheInvalidation] Unknown cache target type:', target);
        return false;
    }

    const deleted = memoryCache.delete(cacheKey);
    console.log(`[CacheInvalidation] ${deleted ? 'Cleared' : 'No cache found for'} ${cacheKey}`);
    return deleted;
  } catch (error) {
    console.error('[CacheInvalidation] Failed to invalidate cache:', error);
    return false;
  }
}

/**
 * Invalidate multiple caches at once
 */
export function invalidateMultipleCaches(targets: CacheTarget[]): number {
  let clearedCount = 0;
  for (const target of targets) {
    if (invalidateCache(target)) {
      clearedCount++;
    }
  }
  console.log(`[CacheInvalidation] Cleared ${clearedCount}/${targets.length} caches`);
  return clearedCount;
}

/**
 * Invalidate all related caches when a team is updated
 * This includes:
 * - Team public page cache
 * - User public page caches (for team leader and members)
 * - Track/Challenge caches if team assignments change
 */
export async function invalidateTeamRelatedCaches(
  teamId: string,
  options?: {
    userIds?: string[];
    trackIds?: string[];
    challengeIds?: string[];
  },
): Promise<void> {
  const targets: CacheTarget[] = [{ type: 'team', teamId }];

  if (options?.userIds) {
    targets.push(...options.userIds.map((userId) => ({ type: 'user' as const, userId })));
  }

  if (options?.trackIds) {
    targets.push(...options.trackIds.map((trackId) => ({ type: 'track' as const, trackId })));
  }

  if (options?.challengeIds) {
    targets.push(
      ...options.challengeIds.map((challengeId) => ({ type: 'challenge' as const, challengeId })),
    );
  }

  invalidateMultipleCaches(targets);
}

/**
 * Invalidate all related caches when a track is updated
 */
export async function invalidateTrackRelatedCaches(
  trackId: string,
  options?: {
    challengeIds?: string[];
  },
): Promise<void> {
  const targets: CacheTarget[] = [{ type: 'track', trackId }, { type: 'tracks-all' }];

  if (options?.challengeIds) {
    targets.push(
      ...options.challengeIds.map((challengeId) => ({ type: 'challenge' as const, challengeId })),
    );
  }

  invalidateMultipleCaches(targets);
}

/**
 * Invalidate all related caches when a challenge is updated
 */
export async function invalidateChallengeRelatedCaches(
  challengeId: string,
  options?: {
    trackId?: string;
  },
): Promise<void> {
  const targets: CacheTarget[] = [{ type: 'challenge', challengeId }];

  if (options?.trackId) {
    targets.push({ type: 'track', trackId: options.trackId }, { type: 'tracks-all' });
  }

  invalidateMultipleCaches(targets);
}
