/**
 * 找隊友功能 - 驗證邏輯
 */

import {
  PII_PATTERNS,
  PII_TYPE_LABELS,
  SENSITIVE_KEYWORDS,
  FIELD_LIMITS,
  QUANTITY_LIMITS,
  PROJECT_TRACKS,
  PROJECT_STAGES,
  ERROR_CODES,
  ERROR_MESSAGES,
} from './constants';
import {
  PIIValidationResult,
  ContentModerationResult,
  TeamNeedFormData,
  ApplicationFormData,
  FormValidationErrors,
  ProjectTrack,
  ProjectStage,
} from './types';

// ============================================================================
// PII 檢測
// ============================================================================

/**
 * 檢測文本中是否包含 PII (個人識別資訊)
 * @param text 要檢測的文本
 * @returns 驗證結果
 */
export function validatePublicField(text: string): PIIValidationResult {
  if (!text || typeof text !== 'string') {
    return { valid: true };
  }

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(text)) {
      const typeKey = type as keyof typeof PII_TYPE_LABELS;
      return {
        valid: false,
        error: `公開欄位建議勿包含${PII_TYPE_LABELS[typeKey]}等個資`,
        detectedType: typeKey,
      };
    }
  }

  return { valid: true };
}

/**
 * 批量檢測多個字段
 * @param fields 要檢測的字段
 * @returns 所有字段的驗證結果
 */
export function validateMultiplePublicFields(
  fields: Record<string, string>,
): Record<string, PIIValidationResult> {
  const results: Record<string, PIIValidationResult> = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    results[fieldName] = validatePublicField(value);
  }

  return results;
}

// ============================================================================
// 敏感內容檢測
// ============================================================================

/**
 * 檢測文本中是否包含敏感關鍵詞
 * @param text 要檢測的文本
 * @returns 檢測結果
 */
export function checkSensitiveContent(text: string): ContentModerationResult {
  if (!text || typeof text !== 'string') {
    return { isFlagged: false, matchedKeywords: [] };
  }

  const matched: string[] = [];
  const lowerText = text.toLowerCase();

  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    }
  }

  return {
    isFlagged: matched.length > 0,
    matchedKeywords: matched,
  };
}

// ============================================================================
// 表單驗證 - 創建/編輯需求
// ============================================================================

/**
 * 驗證需求表單數據
 * @param data 表單數據
 * @param isEdit 是否為編輯模式
 * @returns 驗證錯誤
 */
export function validateTeamNeedForm(
  data: TeamNeedFormData,
  isEdit: boolean = false,
): FormValidationErrors {
  const errors: FormValidationErrors = {};

  // 1. 必填字段檢查
  if (!data.title || data.title.trim().length === 0) {
    errors.title = '專案名稱為必填';
  }

  if (!data.projectTrack) {
    errors.projectTrack = '請選擇目標賽道';
  }

  if (!data.projectStage) {
    errors.projectStage = '請選擇專案階段';
  }

  if (!data.brief || data.brief.trim().length === 0) {
    errors.brief = '專案簡介為必填';
  }

  if (!data.rolesNeeded || data.rolesNeeded.length === 0) {
    errors.rolesNeeded = '請至少選擇一個需要的角色';
  }

  if (!data.contactHint || data.contactHint.trim().length === 0) {
    errors.contactHint = '聯繫提示為必填';
  }

  // 2. 長度限制檢查
  if (data.title && data.title.length > FIELD_LIMITS.TITLE_MAX) {
    errors.title = `專案名稱不可超過 ${FIELD_LIMITS.TITLE_MAX} 字`;
  }

  if (data.brief && data.brief.length > FIELD_LIMITS.BRIEF_MAX) {
    errors.brief = `專案簡介不可超過 ${FIELD_LIMITS.BRIEF_MAX} 字`;
  }

  if (data.otherNeeds && data.otherNeeds.length > FIELD_LIMITS.OTHER_NEEDS_MAX) {
    errors.otherNeeds = `其他需求不可超過 ${FIELD_LIMITS.OTHER_NEEDS_MAX} 字`;
  }

  if (data.contactHint && data.contactHint.length > FIELD_LIMITS.CONTACT_HINT_MAX) {
    errors.contactHint = `聯繫提示不可超過 ${FIELD_LIMITS.CONTACT_HINT_MAX} 字`;
  }

  // 3. 數量限制檢查
  if (data.rolesNeeded && data.rolesNeeded.length > QUANTITY_LIMITS.MAX_ROLES) {
    errors.rolesNeeded = `最多選擇 ${QUANTITY_LIMITS.MAX_ROLES} 個角色`;
  }

  if (data.haveRoles && data.haveRoles.length > QUANTITY_LIMITS.MAX_HAVE_ROLES) {
    errors.haveRoles = `最多選擇 ${QUANTITY_LIMITS.MAX_HAVE_ROLES} 個角色`;
  }

  // 4. Enum 驗證
  if (data.projectTrack && !PROJECT_TRACKS.includes(data.projectTrack as ProjectTrack)) {
    errors.projectTrack = '無效的賽道選項';
  }

  if (data.projectStage && !PROJECT_STAGES.includes(data.projectStage as ProjectStage)) {
    errors.projectStage = '無效的階段選項';
  }

  // 5. PII 檢測 (公開字段)
  const publicFields = {
    title: data.title,
    brief: data.brief,
    otherNeeds: data.otherNeeds || '',
  };

  for (const [fieldName, value] of Object.entries(publicFields)) {
    if (value) {
      const piiResult = validatePublicField(value);
      if (!piiResult.valid) {
        errors[fieldName] = piiResult.error!;
      }
    }
  }

  // 6. 敏感內容檢測
  const allText = [data.title, data.brief, data.otherNeeds].filter(Boolean).join(' ');
  const moderationResult = checkSensitiveContent(allText);
  if (moderationResult.isFlagged) {
    errors._general = `內容包含敏感關鍵詞：${moderationResult.matchedKeywords.join(', ')}`;
  }

  return errors;
}

// ============================================================================
// 表單驗證 - 申請應徵
// ============================================================================

/**
 * 驗證應徵表單數據
 * @param data 表單數據
 * @returns 驗證錯誤
 */
export function validateApplicationForm(data: ApplicationFormData): FormValidationErrors {
  const errors: FormValidationErrors = {};

  // 1. 必填字段檢查
  if (!data.roles || data.roles.length === 0) {
    errors.roles = '請至少選擇一個角色';
  }

  if (!data.contactForOwner || data.contactForOwner.trim().length === 0) {
    errors.contactForOwner = '聯繫方式為必填';
  }

  // 2. 長度限制檢查
  if (data.message && data.message.length > FIELD_LIMITS.MESSAGE_MAX) {
    errors.message = `自我介紹不可超過 ${FIELD_LIMITS.MESSAGE_MAX} 字`;
  }

  if (data.contactForOwner && data.contactForOwner.length > FIELD_LIMITS.CONTACT_FOR_OWNER_MAX) {
    errors.contactForOwner = `聯繫方式不可超過 ${FIELD_LIMITS.CONTACT_FOR_OWNER_MAX} 字`;
  }

  // 3. PII 檢測 (自我介紹建議勿包含聯繫方式等個資)
  if (data.message) {
    const piiResult = validatePublicField(data.message);
    if (!piiResult.valid) {
      errors.message = '自我介紹建議勿包含聯繫方式等個資，請填寫在「聯繫方式」欄位';
    }
  }

  return errors;
}

// ============================================================================
// API 請求驗證
// ============================================================================

/**
 * 驗證創建需求的 API 請求
 * @param body 請求體
 * @returns 驗證結果
 */
export function validateCreateNeedRequest(body: any): {
  valid: boolean;
  errors?: string[];
  data?: any;
} {
  const errors: string[] = [];

  // 檢查必填字段
  const requiredFields = [
    'title',
    'projectTrack',
    'projectStage',
    'brief',
    'rolesNeeded',
    'contactHint',
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 使用表單驗證邏輯
  const formErrors = validateTeamNeedForm(body as TeamNeedFormData);
  if (Object.keys(formErrors).length > 0) {
    return {
      valid: false,
      errors: Object.values(formErrors),
    };
  }

  return { valid: true, data: body };
}

/**
 * 驗證應徵申請的 API 請求
 * @param body 請求體
 * @returns 驗證結果
 */
export function validateApplyRequest(body: any): {
  valid: boolean;
  errors?: string[];
  data?: any;
} {
  const errors: string[] = [];

  // 檢查必填字段
  if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
    errors.push('請至少選擇一個角色');
  }

  if (!body.contactForOwner || typeof body.contactForOwner !== 'string') {
    errors.push('請提供聯繫方式');
  }

  if (!body.recaptchaToken) {
    errors.push('缺少 reCAPTCHA token');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 使用表單驗證邏輯
  const formErrors = validateApplicationForm(body as ApplicationFormData);
  if (Object.keys(formErrors).length > 0) {
    return {
      valid: false,
      errors: Object.values(formErrors),
    };
  }

  return { valid: true, data: body };
}

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 清理和標準化文本
 * @param text 原始文本
 * @returns 清理後的文本
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/\s+/g, ' ') // 多個空格替換為單個
    .replace(/\n{3,}/g, '\n\n'); // 多個換行替換為兩個
}

/**
 * 檢查是否為有效的 Email
 * @param email Email 地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  return PII_PATTERNS.email.test(email);
}

/**
 * 檢查數組是否有效且不為空
 * @param arr 數組
 * @returns 是否有效
 */
export function isNonEmptyArray(arr: any): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * 將驗證錯誤轉換為 API 錯誤格式
 * @param errors 驗證錯誤
 * @returns API 錯誤對象
 */
export function formatValidationErrors(errors: FormValidationErrors): {
  code: string;
  message: string;
  field?: string;
} {
  const firstErrorField = Object.keys(errors)[0];
  const firstErrorMessage = errors[firstErrorField];

  return {
    code: ERROR_CODES.VALIDATION_ERROR,
    message: firstErrorMessage,
    field: firstErrorField !== '_general' ? firstErrorField : undefined,
  };
}

/**
 * 安全地解析 JSON
 * @param str JSON 字符串
 * @param fallback 解析失敗時的默認值
 * @returns 解析結果
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
