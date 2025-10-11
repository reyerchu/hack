# 找隊友功能 - 设计风格指南

## 🎨 颜色主题

### 主色调
- **主题色**: #1a3a6e (深蓝色)
  - 用于：标题、按钮边框、链接、重要元素

### 辅助色
- **文字**: 
  - 正文: #6b7280 (gray-600)
  - 标题: #1a3a6e (主题色)
- **背景**:
  - 页面背景: #ffffff (白色)
  - 卡片背景: #ffffff (白色)
  - 边框: #e5e7eb (gray-200)

---

## 🔘 按钮样式

### 主按钮（与主页 "立即報名 Apply Now" 一致）

```css
/* 基础样式 */
border: 2px solid #1a3a6e;
color: #1a3a6e;
background: transparent;
padding: 12px 32px;  /* px-8 py-3 */
font-size: 14px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.05em;  /* tracking-wider */
transition: all 0.3s;

/* Hover 状态 */
background: #1a3a6e;
color: white;
```

### 尺寸变体
- **Small**: px-4 py-2, text-xs
- **Medium**: px-8 py-3, text-[14px] (默认)
- **Large**: px-10 py-4, text-base

### 按钮变体
1. **Primary** - 主按钮（边框+透明背景）
2. **Secondary** - 次要按钮（填充蓝色）
3. **Outline** - 轮廓按钮（灰色边框）
4. **Danger** - 危险按钮（红色边框）

---

## 📝 字体样式

### 字体族
```css
font-family: 'wavehaus', sans-serif;
```

### 标题层级
- **H1**: text-3xl md:text-4xl, font-bold, color: #1a3a6e
- **H2**: text-2xl md:text-3xl, font-bold, color: #1a3a6e
- **H3**: text-xl, font-semibold, color: #1a3a6e

### 正文文字
- **主要文本**: text-base, text-gray-600 (#6b7280)
- **次要文本**: text-sm, text-gray-500
- **提示文本**: text-xs, text-gray-400

---

## 📐 布局规范

### 页面容器
```css
min-height: 100vh;
background: white;
padding-top: 6rem;    /* pt-24 */
padding-bottom: 2rem; /* pb-8 */
```

### 内容宽度
- **列表页**: max-w-[1400px]
- **详情/表单页**: max-w-4xl

### 间距系统
- **Section 间距**: mb-8 (32px)
- **元素间距**: mb-4 (16px), gap-4 (16px)
- **卡片内边距**: p-6 md:p-8

---

## 🎴 卡片样式

### 标准卡片
```css
background: white;
border: 1px solid #e5e7eb;  /* border-gray-200 */
border-radius: 0.5rem;       /* rounded-lg */
box-shadow: 0 1px 2px rgba(0,0,0,0.05);  /* shadow-sm */
padding: 1.5rem;             /* p-6 */
```

### Hover 效果（列表卡片）
```css
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);  /* hover:shadow-lg */
transition: all 0.3s;
cursor: pointer;
```

---

## 🏷️ 标签/Badge 样式

### 赛道标签（与主题色一致）
```css
background: rgba(26, 58, 110, 0.1);  /* 主题色的10%透明度 */
color: #1a3a6e;
padding: 0.25rem 0.75rem;  /* px-3 py-1 */
font-size: 0.875rem;       /* text-sm */
border-radius: 0.25rem;    /* rounded */
```

### 阶段标签
```css
background: rgba(34, 197, 94, 0.1);  /* 绿色10%透明度 */
color: rgb(22, 101, 52);             /* green-800 */
padding: 0.25rem 0.75rem;
font-size: 0.875rem;
border-radius: 0.25rem;
```

---

## 📱 响应式设计

### 断点
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 响应式类名
```html
<!-- 移动端优先 -->
<h1 className="text-3xl md:text-4xl">
<div className="px-4 md:px-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 🎯 关键组件样式

### 返回按钮
```tsx
<button className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
  <svg className="w-5 h-5">...</svg>
  返回列表
</button>
```

### 编辑按钮（详情页）
```tsx
<button
  className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
  style={{ backgroundColor: '#1a3a6e' }}
>
  <svg className="w-5 h-5">...</svg>
  編輯需求
</button>
```

### 搜索框
```css
border: 1px solid #d1d5db;  /* border-gray-300 */
border-radius: 0.5rem;
padding: 0.75rem 1rem;      /* px-4 py-3 */
focus:border: #1a3a6e;
focus:ring: 1px solid #1a3a6e;
```

---

## 🎨 示例代码

### 页面模板
```tsx
<div className="min-h-screen bg-white pt-24 pb-8">
  <div className="max-w-4xl mx-auto px-4 md:px-8">
    {/* 页面标题 */}
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
        页面标题
      </h1>
      <p className="text-gray-600 text-lg">
        页面描述
      </p>
    </div>

    {/* 内容卡片 */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
      内容
    </div>
  </div>
</div>
```

### 主按钮
```tsx
<Link href="/path">
  <a
    className="inline-block border-2 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
    style={{
      borderColor: '#1a3a6e',
      color: '#1a3a6e',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#1a3a6e';
      e.currentTarget.style.color = 'white';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#1a3a6e';
    }}
  >
    按钮文字
  </a>
</Link>
```

---

## ✅ 检查清单

设计新页面/组件时，确保：

- [ ] 页面背景为白色 (`bg-white`)
- [ ] 标题使用主题色 (#1a3a6e)
- [ ] 按钮样式与主页一致
- [ ] 字体大小和间距合理
- [ ] 响应式设计已测试
- [ ] Hover 效果流畅
- [ ] 与主页风格统一

---

**最后更新**: 2025/10/10
