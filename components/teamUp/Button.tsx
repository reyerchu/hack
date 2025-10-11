/**
 * 统一的按钮组件 - 与主页风格一致
 * 基于主页 "立即報名 Apply Now" 按钮样式
 */

import React, { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * 主按钮组件
 *
 * 样式来源：主页的 "立即報名 Apply Now" 按钮
 * - 边框: 2px solid #1a3a6e
 * - 颜色: #1a3a6e
 * - Hover: 背景 #1a3a6e，文字白色
 * - 字体: uppercase, tracking-wider
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // 主题色（与主页一致）
  const primaryColor = '#1a3a6e';

  // 尺寸配置
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-8 py-3 text-[14px]',
    lg: 'px-10 py-4 text-base',
  };

  // 变体样式
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        // 主按钮（与主页 "立即報名" 按钮一致）
        return {
          base: `inline-block border-2 font-medium uppercase tracking-wider transition-colors duration-300 ${sizeClasses[size]}`,
          style: {
            borderColor: primaryColor,
            color: primaryColor,
            backgroundColor: 'transparent',
          },
          hover: {
            backgroundColor: primaryColor,
            color: 'white',
          },
        };

      case 'secondary':
        // 次要按钮（填充样式）
        return {
          base: `inline-block border-2 font-medium uppercase tracking-wider transition-colors duration-300 ${sizeClasses[size]}`,
          style: {
            borderColor: primaryColor,
            color: 'white',
            backgroundColor: primaryColor,
          },
          hover: {
            backgroundColor: 'transparent',
            color: primaryColor,
          },
        };

      case 'outline':
        // 轮廓按钮（灰色）
        return {
          base: `inline-block border-2 font-medium uppercase tracking-wider transition-colors duration-300 ${sizeClasses[size]}`,
          style: {
            borderColor: '#6b7280',
            color: '#6b7280',
            backgroundColor: 'transparent',
          },
          hover: {
            backgroundColor: '#6b7280',
            color: 'white',
          },
        };

      case 'danger':
        // 危险按钮（红色）
        return {
          base: `inline-block border-2 font-medium uppercase tracking-wider transition-colors duration-300 ${sizeClasses[size]}`,
          style: {
            borderColor: '#dc2626',
            color: '#dc2626',
            backgroundColor: 'transparent',
          },
          hover: {
            backgroundColor: '#dc2626',
            color: 'white',
          },
        };

      default:
        return getVariantStyle();
    }
  };

  const variantConfig = getVariantStyle();

  // 组合类名
  const combinedClassName = `
    ${variantConfig.base}
    ${fullWidth ? 'w-full text-center' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  // Hover 处理
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, variantConfig.hover);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, {
        backgroundColor: variantConfig.style.backgroundColor,
        color: variantConfig.style.color,
      });
    }
  };

  // 如果有 href，渲染为链接
  if (href) {
    return (
      <Link href={href}>
        <a
          className={combinedClassName}
          style={variantConfig.style}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {children}
            </span>
          ) : (
            children
          )}
        </a>
      </Link>
    );
  }

  // 否则渲染为按钮
  return (
    <button
      className={combinedClassName}
      style={variantConfig.style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
