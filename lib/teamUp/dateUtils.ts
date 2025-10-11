/**
 * 日期格式化工具函數
 * 處理 Firestore Timestamp 的各種格式
 */

/**
 * 將各種 timestamp 格式轉換為 Date 對象
 */
export function timestampToDate(timestamp: any): Date {
  // 處理 Firestore Timestamp 對象 (有 toDate 方法)
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // 處理從 API 返回的序列化 Timestamp ({_seconds, _nanoseconds})
  if (timestamp?._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }

  // 處理 ISO 字符串或其他日期格式
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  // 如果已經是 Date 對象
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // 無法識別的格式，拋出錯誤
  throw new Error(`Unable to parse timestamp: ${JSON.stringify(timestamp)}`);
}

/**
 * 格式化為完整日期 (例如: 2025年10月10日)
 */
export function formatDate(timestamp: any, locale: string = 'zh-TW'): string {
  try {
    const date = timestampToDate(timestamp);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error, timestamp);
    return '';
  }
}

/**
 * 格式化為相對時間 (例如: 5 分鐘前, 2 小時前)
 */
export function formatRelativeTime(timestamp: any, locale: string = 'zh-TW'): string {
  try {
    const date = timestampToDate(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 負數表示未來時間
    if (diff < 0) {
      return formatDate(timestamp, locale);
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (locale === 'zh-TW') {
      if (seconds < 10) return '剛剛';
      if (seconds < 60) return `${seconds} 秒前`;
      if (minutes < 60) return `${minutes} 分鐘前`;
      if (hours < 24) return `${hours} 小時前`;
      if (days < 7) return `${days} 天前`;
      if (weeks < 4) return `${weeks} 週前`;
      if (months < 12) return `${months} 個月前`;
      return `${years} 年前`;
    }

    // 英文版本
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error, timestamp);
    return '';
  }
}

/**
 * 格式化為短日期 (例如: 10/10/2025)
 */
export function formatShortDate(timestamp: any, locale: string = 'zh-TW'): string {
  try {
    const date = timestampToDate(timestamp);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting short date:', error, timestamp);
    return '';
  }
}

/**
 * 格式化為日期時間 (例如: 2025年10月10日 下午3:45)
 */
export function formatDateTime(timestamp: any, locale: string = 'zh-TW'): string {
  try {
    const date = timestampToDate(timestamp);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting datetime:', error, timestamp);
    return '';
  }
}

/**
 * 判斷是否為今天
 */
export function isToday(timestamp: any): boolean {
  try {
    const date = timestampToDate(timestamp);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * 判斷是否為昨天
 */
export function isYesterday(timestamp: any): boolean {
  try {
    const date = timestampToDate(timestamp);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * 格式化為智能相對時間（今天顯示時間，昨天顯示"昨天"，更早顯示日期）
 */
export function formatSmartDateTime(timestamp: any, locale: string = 'zh-TW'): string {
  try {
    const date = timestampToDate(timestamp);

    if (isToday(timestamp)) {
      return date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (isYesterday(timestamp)) {
      return locale === 'zh-TW' ? '昨天' : 'Yesterday';
    }

    // 一週內顯示相對時間
    const diff = new Date().getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 7) {
      return formatRelativeTime(timestamp, locale);
    }

    // 更早的顯示完整日期
    return formatDate(timestamp, locale);
  } catch (error) {
    console.error('Error formatting smart datetime:', error, timestamp);
    return '';
  }
}
