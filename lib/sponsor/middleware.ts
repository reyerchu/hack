/**
 * Track Sponsor Feature - API Middleware
 * 
 * 用于 API 路由的权限验证中间件
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { auth, firestore } from 'firebase-admin';
import initializeApi from '../admin/init';
import {
  checkSponsorPermission,
  checkTrackAccess,
  getUserSponsorRole,
} from './permissions';

// 确保 Firebase Admin 已初始化
initializeApi();
const db = firestore();

/**
 * 扩展的 Request 类型（包含用户信息）
 */
export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  userEmail?: string;
  userPermissions?: string[];
}

/**
 * API 响应助手
 */
export class ApiResponse {
  static success(res: NextApiResponse, data: any, message?: string) {
    return res.status(200).json({
      success: true,
      data,
      message,
    });
  }
  
  static error(res: NextApiResponse, error: string, status: number = 400) {
    return res.status(status).json({
      success: false,
      error,
    });
  }
  
  static unauthorized(res: NextApiResponse, message: string = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      error: message,
    });
  }
  
  static forbidden(res: NextApiResponse, message: string = 'Forbidden') {
    return res.status(403).json({
      success: false,
      error: message,
    });
  }
  
  static notFound(res: NextApiResponse, message: string = 'Not found') {
    return res.status(404).json({
      success: false,
      error: message,
    });
  }
}

/**
 * 验证用户身份（基础认证）
 * 
 * 使用方法：
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (!(await requireAuth(req, res))) return;
 *   
 *   const authReq = req as AuthenticatedRequest;
 *   console.log('User ID:', authReq.userId);
 *   // ... your logic
 * }
 * ```
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      ApiResponse.unauthorized(res, 'Missing authorization token');
      return false;
    }
    
    // 验证 token
    const decodedToken = await auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // 获取用户信息
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      ApiResponse.unauthorized(res, 'User not found');
      return false;
    }
    
    const userData = userDoc.data();
    
    // 将用户信息附加到 request 对象
    const authReq = req as AuthenticatedRequest;
    authReq.userId = userId;
    authReq.userEmail = userData?.preferredEmail || decodedToken.email;
    authReq.userPermissions = userData?.permissions || [];
    
    return true;
  } catch (error: any) {
    console.error('Auth error:', error);
    ApiResponse.unauthorized(res, 'Invalid or expired token');
    return false;
  }
}

/**
 * 验证用户是否有赞助商权限
 * 
 * 使用方法：
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (!(await requireSponsorAuth(req, res))) return;
 *   
 *   // User is authenticated and has sponsor permission
 *   // ... your logic
 * }
 * ```
 */
export async function requireSponsorAuth(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  // 首先验证基础认证
  if (!(await requireAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const permissions = authReq.userPermissions || [];
  
  // 检查是否有 sponsor 或 admin 权限
  if (
    !permissions.includes('sponsor') &&
    !permissions.includes('admin') &&
    !permissions.includes('super_admin')
  ) {
    ApiResponse.forbidden(res, 'Sponsor permission required');
    return false;
  }
  
  return true;
}

/**
 * 验证用户是否可以访问指定赛道
 * 
 * 使用方法：
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const { trackId } = req.query;
 *   
 *   if (!(await requireTrackAccess(req, res, trackId as string))) return;
 *   
 *   // User has access to this track
 *   // ... your logic
 * }
 * ```
 */
export async function requireTrackAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  trackId: string,
): Promise<boolean> {
  // 首先验证赞助商权限
  if (!(await requireSponsorAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  // 检查赛道访问权限
  const hasAccess = await checkTrackAccess(userId, trackId);
  
  if (!hasAccess) {
    ApiResponse.forbidden(res, 'No access to this track');
    return false;
  }
  
  return true;
}

/**
 * 验证用户是否可以访问指定赞助商
 * 
 * 使用方法：
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const { sponsorId } = req.query;
 *   
 *   if (!(await requireSponsorAccess(req, res, sponsorId as string))) return;
 *   
 *   // User has access to this sponsor
 *   // ... your logic
 * }
 * ```
 */
export async function requireSponsorAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  sponsorId: string,
): Promise<boolean> {
  // 首先验证赞助商权限
  if (!(await requireSponsorAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  // 检查赞助商访问权限
  const hasAccess = await checkSponsorPermission(userId, sponsorId);
  
  if (!hasAccess) {
    ApiResponse.forbidden(res, 'No access to this sponsor');
    return false;
  }
  
  return true;
}

/**
 * 验证用户是否有特定的赞助商角色
 * 
 * 使用方法：
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const { sponsorId } = req.query;
 *   
 *   if (!(await requireSponsorRole(req, res, sponsorId as string, ['admin']))) return;
 *   
 *   // User is an admin of this sponsor
 *   // ... your logic
 * }
 * ```
 */
export async function requireSponsorRole(
  req: NextApiRequest,
  res: NextApiResponse,
  sponsorId: string,
  requiredRoles: Array<'admin' | 'viewer' | 'judge'>,
): Promise<boolean> {
  // 首先验证赞助商访问权限
  if (!(await requireSponsorAccess(req, res, sponsorId))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  // 检查角色
  const userRole = await getUserSponsorRole(userId, sponsorId);
  
  if (!userRole || !requiredRoles.includes(userRole)) {
    ApiResponse.forbidden(
      res,
      `Required role: ${requiredRoles.join(' or ')}. Your role: ${userRole || 'none'}`,
    );
    return false;
  }
  
  return true;
}

/**
 * 验证用户是否是 Admin
 * 
 * 使用方法：
 * ```typescript
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (!(await requireAdmin(req, res))) return;
 *   
 *   // User is an admin
 *   // ... your logic
 * }
 * ```
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  // 首先验证基础认证
  if (!(await requireAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const permissions = authReq.userPermissions || [];
  
  // 检查是否是 admin
  if (!permissions.includes('admin') && !permissions.includes('super_admin')) {
    ApiResponse.forbidden(res, 'Admin permission required');
    return false;
  }
  
  return true;
}

/**
 * 组合中间件助手
 * 
 * 允许链式调用多个中间件
 * 
 * 使用方法：
 * ```typescript
 * export default withMiddleware(
 *   [requireSponsorAuth],
 *   async (req: NextApiRequest, res: NextApiResponse) => {
 *     // Your logic here
 *   }
 * );
 * ```
 */
export function withMiddleware(
  middlewares: Array<(req: NextApiRequest, res: NextApiResponse) => Promise<boolean>>,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 依次执行所有中间件
    for (const middleware of middlewares) {
      const passed = await middleware(req, res);
      if (!passed) {
        return; // 中间件已经发送了响应
      }
    }
    
    // 所有中间件通过，执行主处理函数
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('Handler error:', error);
      ApiResponse.error(res, error.message || 'Internal server error', 500);
    }
  };
}

