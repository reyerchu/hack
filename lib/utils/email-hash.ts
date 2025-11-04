/**
 * Email Hash 工具
 *
 * 為了隱私，不在 URL 中直接顯示 email
 */

import crypto from 'crypto';

/**
 * 將 email 轉換為短 hash
 * 使用 MD5 的前 12 位
 */
export function emailToHash(email: string): string {
  if (!email) return '';

  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');

  // 取前 12 位作為短 hash
  return hash.substring(0, 12);
}

/**
 * 驗證 hash 格式
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{12}$/.test(hash);
}
