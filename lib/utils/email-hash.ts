/**
 * Email Hash 工具
 *
 * 為了隱私，不在 URL 中直接顯示 email
 */

import crypto from 'crypto';

/**
 * 將 email 轉換為 MD5 hash
 * 使用完整的 32 位 MD5
 */
export function emailToHash(email: string): string {
  if (!email) return '';

  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');

  // 返回完整的 32 位 MD5 hash
  return hash;
}

/**
 * 驗證 hash 格式（32 位 MD5）
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{32}$/i.test(hash);
}
