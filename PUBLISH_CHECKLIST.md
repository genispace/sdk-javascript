# GeniSpace SDK 发布检查清单

## 📋 发布前检查

### ✅ 代码质量
- [ ] 所有TypeScript代码编译无错误
- [ ] ESLint检查通过
- [ ] 所有测试通过
- [ ] 代码已提交到Git

### ✅ 版本管理
- [ ] 更新了版本号（package.json）
- [ ] 更新了CHANGELOG.md（如果有）
- [ ] Git工作目录干净

### ✅ 构建检查
- [ ] `npm run build` 成功
- [ ] `lib/` 目录包含所有必需文件
- [ ] `lib/index.js` 和 `lib/index.d.ts` 存在

### ✅ 包配置
- [ ] package.json 配置正确
- [ ] .npmignore 配置正确
- [ ] README.md 更新
- [ ] LICENSE 文件存在

### ✅ NPM准备
- [ ] 已登录NPM账户 (`npm whoami`)
- [ ] 有发布权限
- [ ] 包名可用或已拥有

## 🚀 发布步骤

### 方法一：使用发布脚本（推荐）
```bash
./scripts/publish.sh
```

### 方法二：手动发布
```bash
# 1. 构建
npm run build

# 2. 版本管理
npm version patch  # 或 minor/major

# 3. 发布
npm publish          # 正式版
npm publish --tag beta  # 测试版

# 4. Git标签
git push origin main
git push origin --tags
```

## 📦 发布后验证

### ✅ NPM验证
- [ ] 访问 https://www.npmjs.com/package/genispace
- [ ] 检查版本号正确
- [ ] 检查文件列表完整

### ✅ 安装测试
```bash
# 新目录测试安装
mkdir test-install && cd test-install
npm init -y
npm install genispace

# 测试导入
node -e "const GeniSpace = require('genispace'); console.log('SDK loaded:', typeof GeniSpace);"
```

### ✅ 使用测试
```javascript
const GeniSpace = require('genispace');

const client = new GeniSpace({
  apiKey: 'your-api-key',
  baseURL: 'https://api.genispace.com'
});

// 测试基本功能
client.users.getProfile().then(console.log).catch(console.error);
```

## 🔄 版本管理策略

### 语义化版本控制
- **patch (x.y.Z)**: 修复bug，向后兼容
- **minor (x.Y.z)**: 新功能，向后兼容  
- **major (X.y.z)**: 破坏性变更，不向后兼容

### 发布标签
- **latest**: 稳定正式版本
- **beta**: 测试版本
- **alpha**: 开发版本

## 📞 支持

发布过程中如有问题，请联系：
- 技术支持: dev@genispace.ai
- 文档: https://genispace.ai/docs/sdk
- Issues: https://github.com/genispace/sdk-javascript/issues
