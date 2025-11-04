/**
 * 将文本中的 URL 转换为可点击的链接
 * 支持：http://, https://, www.
 */

import React from 'react';

// URL 正则表达式
const URL_REGEX =
  /(\b(https?:\/\/|www\.)[^\s<>，。！？;；：:、\(\)\[\]]+[^\s<>，。！？;；：:、\(\)\[\]\.,!?])/gi;

/**
 * 将文本中的 URL 转换为可点击的链接
 * @param text 原始文本
 * @param linkColor 链接颜色（可选）
 * @returns React 元素数组
 */
export function linkifyText(text: string, linkColor: string = '#2563eb'): React.ReactNode[] {
  if (!text || typeof text !== 'string') return [''];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 重置正则表达式的 lastIndex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const index = match.index;

    // 添加 URL 之前的文本
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // 确保 URL 有协议前缀
    let href = url;
    if (!href.match(/^https?:\/\//i)) {
      href = 'http://' + href;
    }

    // 添加可点击的链接
    parts.push(
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:no-underline font-medium break-all"
        style={{ color: linkColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>,
    );

    lastIndex = index + url.length;
  }

  // 添加最后剩余的文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * React 组件：显示带有激活链接的文本
 */
interface LinkifiedTextProps {
  text: string;
  linkColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({
  text,
  linkColor = '#2563eb',
  className = '',
  style = {},
}) => {
  const content = linkifyText(text, linkColor);

  return (
    <span className={className} style={style}>
      {content}
    </span>
  );
};
