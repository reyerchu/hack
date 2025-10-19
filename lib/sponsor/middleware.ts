/**
 * Track Sponsor Feature - API Middleware
 * 
 * 用於 API 路由的權限驗證中間件
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
 * 獲取用戶數據（支持多個 collection）
 * 
 * @param userId - Firebase Auth UID
 * @returns 用戶數據和 document ID
 */
async function getUserData(
  firebaseUid: string, 
  email?: string
): Promise<{
  exists: boolean;
  data: any;
  docId: string;
} | null> {
  try {
    // 1. 先嘗試 registrations collection（黑客松用戶）
    let userDoc = await db.collection('registrations').doc(firebaseUid).get();
    if (userDoc.exists) {
      return { exists: true, data: userDoc.data(), docId: userDoc.id };
    }

    // 2. 如果提供了 email，嘗試透過 email 查詢 registrations
    if (email) {
      const regByEmail = await db.collection('registrations').where('email', '==', email).limit(1).get();
      if (!regByEmail.empty) {
        const doc = regByEmail.docs[0];
        return { exists: true, data: doc.data(), docId: doc.id };
      }
    }

    // 3. 嘗試透過 Firebase UID 查詢 registrations（如果有 uid 字段）
    const regByUID = await db.collection('registrations').where('uid', '==', firebaseUid).limit(1).get();
    if (!regByUID.empty) {
      const doc = regByUID.docs[0];
      return { exists: true, data: doc.data(), docId: doc.id };
    }

    // 4. 嘗試 users collection（向後兼容）
    userDoc = await db.collection('users').doc(firebaseUid).get();
    if (userDoc.exists) {
      return { exists: true, data: userDoc.data(), docId: userDoc.id };
    }

    return null;
  } catch (error) {
    console.error('Error getting user data in middleware:', error);
    return null;
  }
}

/**
 * 擴展的 Request 類型（包含用戶資訊）
 */
export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  userEmail?: string;
  userPermissions?: string[];
}

/**
 * API 響應助手
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
 * 驗證用戶身份（基礎認證）
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
    console.log('[requireAuth] 開始驗證...');
    console.log('[requireAuth] Authorization header:', req.headers.authorization?.substring(0, 50));
    
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      console.error('[requireAuth] Missing token');
      ApiResponse.unauthorized(res, 'Missing authorization token');
      return false;
    }
    
    console.log('[requireAuth] Token length:', token.length);
    
    // 驗證 token
    console.log('[requireAuth] 驗證 ID token...');
    const decodedToken = await auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    
    console.log('[requireAuth] Token 驗證成功:', { uid: firebaseUid, email });
    
    // 獲取用戶資訊（支持多個 collection）
    console.log('[requireAuth] 獲取用戶數據...');
    const userInfo = await getUserData(firebaseUid, email);
    
    if (!userInfo || !userInfo.exists) {
      console.error('[requireAuth] User not found:', { firebaseUid, email });
      ApiResponse.unauthorized(res, 'User not found');
      return false;
    }
    
    console.log('[requireAuth] 用戶數據找到:', { docId: userInfo.docId });
    
    const userData = userInfo.data;
    
    // 處理不同的數據結構
    // 1. 前端註冊用戶: { user: { permissions: [...] }, ... }
    // 2. 腳本創建用戶: { permissions: [...], ... }
    const nestedUser = userData?.user;
    const permissions = nestedUser?.permissions || userData?.permissions || [];
    const userEmail = 
      userData?.email || 
      nestedUser?.preferredEmail || 
      userData?.preferredEmail || 
      email;  // 使用之前從 token 獲取的 email
    
    // 將用戶資訊附加到 request 對象
    // ⚠️ 重要：使用 Firestore document ID，不是 Firebase Auth UID
    const authReq = req as AuthenticatedRequest;
    authReq.userId = userInfo.docId;  // 使用 Firestore document ID
    authReq.userEmail = userEmail;
    authReq.userPermissions = permissions;
    
    console.log('Auth success:', {
      firebaseUid,
      firestoreDocId: userInfo.docId,
      email: authReq.userEmail,
      permissions: authReq.userPermissions,
    });
    
    console.log('[requireAuth] 驗證完成 ✅');
    return true;
  } catch (error: any) {
    console.error('[requireAuth] ❌ Auth error:', error.message, error.code);
    ApiResponse.unauthorized(res, 'Invalid or expired token');
    return false;
  }
}

/**
 * 驗證用戶是否有贊助商權限
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
  // 首先驗證基礎認證
  if (!(await requireAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const permissions = authReq.userPermissions || [];
  
  // 檢查是否有 sponsor 或 admin 權限
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
 * 驗證用戶是否可以访问指定賽道
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
  // 首先驗證贊助商權限
  if (!(await requireSponsorAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  // 檢查賽道访问權限
  const hasAccess = await checkTrackAccess(userId, trackId);
  
  if (!hasAccess) {
    ApiResponse.forbidden(res, 'No access to this track');
    return false;
  }
  
  return true;
}

/**
 * 驗證用戶是否可以访问指定贊助商
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
  // 首先驗證贊助商權限
  if (!(await requireSponsorAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  // 檢查贊助商访问權限
  const hasAccess = await checkSponsorPermission(userId, sponsorId);
  
  if (!hasAccess) {
    ApiResponse.forbidden(res, 'No access to this sponsor');
    return false;
  }
  
  return true;
}

/**
 * 驗證用戶是否有特定的贊助商角色
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
  // 首先驗證贊助商访问權限
  if (!(await requireSponsorAccess(req, res, sponsorId))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  
  // 檢查角色
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
 * 驗證用戶是否是 Admin
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
  // 首先驗證基礎認證
  if (!(await requireAuth(req, res))) {
    return false;
  }
  
  const authReq = req as AuthenticatedRequest;
  const permissions = authReq.userPermissions || [];
  
  // 檢查是否是 admin
  if (!permissions.includes('admin') && !permissions.includes('super_admin')) {
    ApiResponse.forbidden(res, 'Admin permission required');
    return false;
  }
  
  return true;
}

/**
 * 組合中間件助手
 * 
 * 允許鏈式調用多個中間件
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
    // 依次執行所有中間件
    for (const middleware of middlewares) {
      const passed = await middleware(req, res);
      if (!passed) {
        return; // 中間件已經發送了響應
      }
    }
    
    // 所有中間件透過，執行主處理函数
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error('Handler error:', error);
      ApiResponse.error(res, error.message || 'Internal server error', 500);
    }
  };
}

