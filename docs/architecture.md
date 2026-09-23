# 旅游内容矩阵技术架构

## 核心流程
1. **内容管理 (CMS)**: 使用 Google Sheets/Airtable 管理城市、路线、景点、价格等结构化数据。
2. **静态生成 (SSG)**: 使用 Astro 框架，通过 API 读取内容数据库，在构建时动态生成所有城市的 HTML 页面。
3. **自动化部署 (CI/CD)**: 托管在 Cloudflare Pages，代码提交或触发构建后自动发布至全球 CDN。
4. **性能与SEO**: 利用 Astro 的零 JS 默认策略和 Cloudflare 的边缘节点，确保极速加载。通过 Google Search Console 监控收录情况。

## 技术栈
- **框架**: Astro (SSG 模式)
- **内容源**: Google Sheets API / Airtable API
- **部署平台**: Cloudflare Pages
- **监控**: Google Search Console
- **资源存储**: Cloudflare R2 或外部图床 (用于存储景点照片)

## 部署方案
- 每月构建额度: 500 次 (Cloudflare 免费版)
- 文件上限: 20,000 个文件 (足够初期扩展)
- 流量: 静态资源无限量
