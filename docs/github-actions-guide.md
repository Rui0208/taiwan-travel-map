# GitHub Actions 使用指南

## 📋 概述

本專案使用 GitHub Actions 實現完整的 CI/CD 流程，確保程式碼品質和自動化部署。

## 🔧 工作流程配置

### 觸發條件
- **推送到 main/develop 分支**：自動執行完整檢查
- **建立 Pull Request**：執行程式碼品質檢查

### 執行作業

#### 1. 程式碼品質檢查 (`quality-check`)
```yaml
- 安裝依賴套件
- ESLint 程式碼檢查
- TypeScript 型別檢查
- Next.js 建置測試
```

#### 2. 自動化測試 (`test`)
```yaml
- 執行 Jest 測試
- 生成測試覆蓋率報告
- 上傳覆蓋率到 Codecov
```

#### 3. 安全性檢查 (`security-check`)
```yaml
- 依賴套件安全性審計
- 檢查過期套件
```

## 🚀 本地開發

### 執行測試
```bash
# 執行所有測試
yarn test

# 監控模式
yarn test:watch

# 生成覆蓋率報告
yarn test:coverage

# 程式碼檢查
yarn lint

# 型別檢查
yarn type-check
```

### 測試檔案結構
```
src/
├── components/
│   └── __tests__/
│       └── ComponentName.test.tsx
├── lib/
│   └── __tests__/
│       └── utility.test.ts
└── app/
    └── __tests__/
        └── page.test.tsx
```

## 🔐 環境變數設定

在 GitHub 倉庫的 Settings > Secrets and variables > Actions 中設定：

### 必需變數
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 專案 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名金鑰

### 可選變數
- `CODECOV_TOKEN` - Codecov 覆蓋率報告 Token

## 📊 監控與報告

### 測試覆蓋率
- 自動生成覆蓋率報告
- 上傳到 Codecov 平台
- 在 README 顯示覆蓋率徽章

### 建置狀態
- 每次提交都會顯示建置狀態
- 失敗時會發送通知
- 可在 Actions 頁面查看詳細日誌

## 🛠️ 故障排除

### 常見問題

1. **測試失敗**
   - 檢查測試檔案是否正確
   - 確認 Mock 設定是否完整
   - 查看測試日誌

2. **建置失敗**
   - 檢查 TypeScript 錯誤
   - 確認 ESLint 規則
   - 驗證環境變數設定

3. **部署失敗**
   - 檢查 Vercel 配置
   - 確認環境變數
   - 查看部署日誌

### 本地測試 CI/CD
```bash
# 模擬 CI 環境
yarn install --frozen-lockfile
yarn lint
yarn type-check
yarn build
yarn test
```

## 📈 最佳實踐

1. **提交前檢查**
   - 本地執行測試
   - 檢查程式碼風格
   - 確認型別檢查通過

2. **分支策略**
   - 使用 feature 分支開發
   - 建立 PR 進行程式碼審查
   - 合併前確保 CI 通過

3. **測試策略**
   - 為新功能添加測試
   - 保持測試覆蓋率 > 50%
   - 定期更新測試案例

## 🔄 工作流程更新

如需修改工作流程：

1. 編輯 `.github/workflows/ci-cd.yml`
2. 提交並推送到 GitHub
3. 在 Actions 頁面查看執行結果
4. 根據需要調整配置

## 📞 支援

如有問題，請：
1. 查看 Actions 頁面的執行日誌
2. 檢查 GitHub Actions 文件
3. 聯繫專案維護者 