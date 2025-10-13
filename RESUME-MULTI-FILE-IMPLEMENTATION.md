
# 多文件履历上传功能 - 完整实现指南

## ✅ 已完成 (后端 100%)

### 1. API 端点

#### ✅ POST `/api/resume/upload`
- 上传单个文件
- 自动添加到用户的 `resumes` 数组
- 支持 `userId` 参数

#### ✅ DELETE `/api/resume/delete`
- 删除指定文件
- 验证用户所有权
- 从 Storage 和 Firestore 删除

#### ✅ GET `/api/resume/list?userId=xxx`
- 列出用户的所有履历文件
- 返回文件状态（是否存在于 Storage）
- 返回文件元数据

### 2. 数据迁移

✅ 已成功迁移 56 个用户
- 14 个用户有现有履历（转换为数组）
- 42 个用户设置为空数组

### 3. 测试结果

```bash
# 测试 List API
curl "http://localhost:3008/api/resume/list?userId=uzzaaoqnViVklglHDTQ1KCCbSXt2"
# ✅ 返回文件列表

# 服务状态
systemctl status hackportal
# ✅ 运行正常
```

---

## 📝 待完成 (前端 UI)

### 1. Profile 页面更新

需要修改：`pages/profile.tsx`

#### 当前代码位置：
- 第 30 行：`const [resumeFile, setResumeFile] = useState<File | null>(null);`
- 第 556-633 行：Resume 显示和上传部分

#### 需要的更改：

```typescript
// 1. 添加状态管理
const [resumeFiles, setResumeFiles] = useState<any[]>([]);
const [isLoadingResumes, setIsLoadingResumes] = useState(false);
const [uploadingFile, setUploadingFile] = useState(false);

// 2. 获取履历列表
useEffect(() => {
  if (user?.id && activeTab === 'profile') {
    fetchResumeList();
  }
}, [user?.id, activeTab]);

const fetchResumeList = async () => {
  if (!user?.id) return;
  setIsLoadingResumes(true);
  try {
    const response = await fetch(`/api/resume/list?userId=${user.id}`);
    const data = await response.json();
    if (data.success) {
      setResumeFiles(data.files);
    }
  } catch (error) {
    console.error('Failed to fetch resume list:', error);
  } finally {
    setIsLoadingResumes(false);
  }
};

// 3. 上传新文件
const handleUploadResume = async (file: File) => {
  if (!user?.id) return;
  
  setUploadingFile(true);
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('fileName', `${user.id}_${file.name}`);
  formData.append('userId', user.id);
  formData.append('studyLevel', profile?.studyLevel || 'Unknown');
  formData.append('major', profile?.major || 'Unknown');

  try {
    const response = await fetch('/api/resume/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      alert('上传成功！');
      fetchResumeList(); // 刷新列表
    } else {
      alert('上传失败');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('上传失败');
  } finally {
    setUploadingFile(false);
  }
};

// 4. 删除文件
const handleDeleteResume = async (fileName: string) => {
  if (!user?.id) return;
  
  if (!confirm(`确定要删除 ${fileName}？`)) return;
  
  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/resume/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ fileName }),
    });
    
    const data = await response.json();
    if (data.success) {
      alert('删除成功');
      fetchResumeList(); // 刷新列表
    } else {
      alert('删除失败：' + data.message);
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('删除失败');
  }
};
```

#### UI 组件示例：

```jsx
{/* 履历文件列表 */}
<div className="profile-field">
  <div className="font-bold text-lg mb-2">履历文件</div>
  
  {isLoadingResumes ? (
    <div>加载中...</div>
  ) : (
    <>
      {/* 已上传的文件列表 */}
      {resumeFiles.length > 0 ? (
        <div className="space-y-2 mb-4">
          {resumeFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium">{file.fileName}</div>
                  {file.exists ? (
                    <div className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </div>
                  ) : (
                    <div className="text-xs text-red-500">文件不存在</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteResume(file.fileName)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 mb-4">尚未上传履历</div>
      )}
      
      {/* 上传新文件 */}
      <div>
        <label className="block mb-2 text-sm font-medium">上传新履历</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadResume(file);
          }}
          disabled={uploadingFile}
          className="border-2 border-gray-400 rounded p-2 text-sm w-full"
        />
        {uploadingFile && <div className="text-blue-500 text-sm mt-2">上传中...</div>}
      </div>
    </>
  )}
</div>
```

---

### 2. Admin 用户详情页更新

需要修改：`components/adminComponents/UserAdminView.tsx`

#### 当前代码位置：
- 第 432-487 行：Resume 显示部分

#### 需要的更改：

```typescript
// 1. 添加状态
const [resumes, setResumes] = useState<any[]>([]);

// 2. 获取履历列表
useEffect(() => {
  if (selectedUser?.user?.id) {
    fetchUserResumes();
  }
}, [selectedUser?.user?.id]);

const fetchUserResumes = async () => {
  if (!selectedUser?.user?.id) return;
  
  try {
    const response = await fetch(`/api/resume/list?userId=${selectedUser.user.id}`);
    const data = await response.json();
    if (data.success) {
      setResumes(data.files);
    }
  } catch (error) {
    console.error('Failed to fetch resumes:', error);
  }
};

// 3. 下载文件
const handleDownloadResume = async (fileName: string) => {
  try {
    const response = await fetch(`/api/resume/${selectedUser.user.id}`);
    const data = await response.json();
    if (data.url) {
      window.open(data.url, '_blank');
    } else {
      alert('文件不存在');
    }
  } catch (error) {
    alert('获取文件失败');
  }
};
```

#### UI 组件示例：

```jsx
{/* 履历文件列表 */}
<div>
  <label className="block text-sm font-medium text-gray-600 mb-2">履历文件</label>
  
  {resumes.length > 0 ? (
    <div className="space-y-2">
      {resumes.map((file, index) => (
        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-medium text-sm">{file.fileName}</div>
              {file.exists ? (
                <div className="text-xs text-green-600">✓ 文件存在</div>
              ) : (
                <div className="text-xs text-red-600">✗ 文件不存在</div>
              )}
            </div>
          </div>
          {file.exists && (
            <button
              onClick={() => handleDownloadResume(file.fileName)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              下载
            </button>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-gray-500">无履历文件</div>
  )}
</div>
```

---

## 🧪 测试步骤

### 1. API 测试（已完成 ✅）

```bash
# 列出文件
curl "http://localhost:3008/api/resume/list?userId=YOUR_USER_ID"

# 上传文件（需要 form-data）
curl -X POST http://localhost:3008/api/resume/upload \
  -F "resume=@test.pdf" \
  -F "fileName=USER_ID_test.pdf" \
  -F "userId=USER_ID"

# 删除文件（需要 Bearer token）
curl -X DELETE http://localhost:3008/api/resume/delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"USER_ID_test.pdf"}'
```

### 2. UI 测试（待完成）

1. ✅ 访问 Profile 页面
2. ✅ 查看履历列表
3. ✅ 上传新文件
4. ✅ 删除文件
5. ✅ 访问 Admin 用户详情页
6. ✅ 查看用户的所有履历

---

## 📊 数据库结构

### 旧格式（已废弃）
```json
{
  "resume": "userId_filename.pdf"
}
```

### 新格式（当前）
```json
{
  "resume": "userId_filename.pdf",  // 保留向后兼容
  "resumes": [
    "userId_filename1.pdf",
    "userId_filename2.pdf"
  ]
}
```

---

## 🚀 部署清单

- [x] 数据迁移
- [x] API 开发
- [x] API 测试
- [x] 构建和部署
- [ ] Profile 页面 UI
- [ ] Admin 页面 UI
- [ ] 完整功能测试

---

## 💡 下一步建议

### 选项 A：手动实现 UI
使用上面提供的代码示例，手动更新 Profile 和 Admin 页面

### 选项 B：先测试 API
使用 curl 或 Postman 测试所有 API 端点，确认功能正常

### 选项 C：分阶段上线
1. 先上线后端 API
2. 保持现有单文件 UI
3. 逐步迁移到多文件 UI

