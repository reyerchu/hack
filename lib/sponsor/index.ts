/**
 * Track Sponsor Feature - Main Export
 * 
 * 统一导出所有赞助商相关的功能
 */

// Types
export * from './types';
export * from './collections';

// Permissions
export * from './permissions';

// Middleware (explicit exports to avoid naming conflicts)
export type { AuthenticatedRequest } from './middleware';
export {
  ApiResponse,
  requireAuth,
  requireSponsorAuth,
  requireTrackAccess,
  requireSponsorAccess,
  requireSponsorRole,
  requireAdmin,
  withMiddleware,
} from './middleware';

// Activity Logging
export * from './activity-log';

