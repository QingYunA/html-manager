# HTML Manager 🚀

> **专为 AI 创意单页打造的开源自建托管与展示平台。**
> 无论是 Claude Artifacts、ChatGPT Canvas 还是本地编写的交互式小工具、小游戏、数据可视化与页面原型，都可以一键上传、分类管理并优雅展示。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FQingYunA%2Fhtml-manager&env=ADMIN_PASSWORD&envDescription=Set%20a%20master%20password%20for%20accessing%20the%20admin%20dashboard&stores=%5B%7B%22type%22%3A%22postgres%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

---

## ✨ 核心特性

- 🎨 **精美公开画廊 (Showcase)**：
  - 高质感渐变卡片、分类导航（实用工具、互动游戏、数据可视化、页面原型、动效演示等）；
  - 毫秒级即时搜索、多标签联动过滤、网格 (Grid) 与紧凑列表 (List) 自由切换；
  - 置顶推荐 (Pin) 与秒级弹窗即时试玩预览。
- 🖥️ **全功能交互式运行台 (Runner `/p/[slug]`)**：
  - 多端响应式视口一键切换：**桌面端 (100%)**、**平板端 (768px)**、**手机端 (375px)**；
  - 浏览器原生全屏模式、HTML 源码查看与一键复制、直达链接与二维码分享；
  - 独立洁净沙箱直链 `/raw/[slug]/` 供外链直接引用或嵌入。
- 🛡️ **严格安全沙箱防护**：
  - Iframe 隔离沙箱 (`sandbox="allow-scripts allow-forms allow-downloads allow-popups"`)；
  - 物理切断外部脚本访问宿主 LocalStorage、Cookies 与 Session 的途径，安全可靠；
  - 纯净端点自动注入严格 `Content-Security-Policy`。
- ⚡ **多形态极速入库**：
  - 单文件 `.html` 拖拽或选择上传；
  - 多资源静态 `.zip` 压缩包（自动解压并平铺静态相对路径资源，如本地图片、CSS、JS）；
  - 直接粘贴 AI 代码，智能自动提取 `<title>` 与 `<meta description>`；
  - 内置基于 CodeMirror 的在线代码微调编辑器与即时效果预览。
- 🤖 **自动化与 AI Agent 友好**：
  - 提供 `POST /api/upload` 开放端点（支持 Bearer Token 鉴权）；
  - 支持通过 `curl` 或在 Cursor / Claude Code 中编写命令，生成 HTML 后一行命令自动推送到平台并返回直达链接。
- ☁️ **零门槛一键部署 (Vercel 1-Click Deploy)**：
  - 存储抽象层（Storage Adapter）：内置 **Vercel Blob** 与 **Cloudflare R2** 双驱动；
  - 数据库：支持 Vercel Postgres、Neon、Supabase（本地开发自动 fallback 到零配置轻量存储）。

---

## 🚀 快速开始

### 方式一：Vercel 一键部署（推荐）

1. 点击上方的 **[Deploy with Vercel]** 按钮；
2. 按照 Vercel 向导创建仓库，并在创建项目时关联 **Vercel Postgres** 与 **Vercel Blob**（免费开通）；
3. 填入你的管理员密码环境变量 `ADMIN_PASSWORD=xxxx`；
4. 部署完成，立即获得属于你自己的 HTML Manager 专属站点！

### 方式二：本地开发运行

项目自带零配置轻量持久化能力，初次启动无需配置任何远端数据库即可完整运行：

```bash
# 1. 克隆代码
git clone https://github.com/QingYunA/html-manager.git
cd html-manager

# 2. 安装依赖 (推荐 bun 或 pnpm / npm)
bun install
# 或者 npm install

# 3. 启动开发服务器
bun run dev
# 或者 npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可查看公开画廊，访问 `/admin/login` 输入默认密码（开发默认：`admin888`）进入后台。

---

## ⚙️ 环境变量说明

在 `.env.local` 或 Vercel 环境变量中配置：

| 环境变量 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | **是** | `admin888` (仅dev) | 管理员登录控制台密码，也可用作 API Token |
| `DATABASE_URL` | 生产必填 | 空 (本地自动走 `.data/db.json`) | 标准 PostgreSQL 连接串（Vercel Postgres / Neon / Supabase） |
| `BLOB_READ_WRITE_TOKEN` | 可选 | 空 | Vercel Blob 对象存储 Token（Vercel 部署自动注入） |
| `R2_ACCOUNT_ID` | 可选 | 空 | Cloudflare R2 Account ID（若使用 R2） |
| `R2_ACCESS_KEY_ID` | 可选 | 空 | Cloudflare R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | 可选 | 空 | Cloudflare R2 Secret Access Key |
| `R2_BUCKET_NAME` | 可选 | `html-manager` | Cloudflare R2 存储桶名称 |
| `API_TOKEN` | 可选 | 与 `ADMIN_PASSWORD` 相同 | 自定义开放 API 专用 Token |

> **提示**：若同时配置了 `BLOB_READ_WRITE_TOKEN` 和 R2 参数，系统将优先检测 Blob；若均未配置，本地开发时自动使用本地文件系统 `.storage/` 目录。

---

## 🔌 API 自动化推送示例

通过接口直接将 AI 生成的 HTML 推送到你的平台：

### 1. cURL 文件上传
```bash
curl -X POST https://your-domain.com/api/upload \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  -F "file=@demo-artifact.html" \
  -F "title=2048 小游戏" \
  -F "category=games" \
  -F "tags=Canvas,Game"
```

### 2. JSON 代码推送 (供 Cursor / AI 脚本)
```bash
curl -X POST https://your-domain.com/api/upload \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "简易计算器",
    "html": "<!DOCTYPE html><html><head><title>Calculator</title></head><body>...</body></html>",
    "category": "tools",
    "tags": ["Calculator", "Vue"]
  }'
```

**响应示例**：
```json
{
  "success": true,
  "id": "ck89ab12cd34",
  "title": "简易计算器",
  "slug": "calculator",
  "url": "https://your-domain.com/p/calculator",
  "rawUrl": "https://your-domain.com/raw/calculator/",
  "category": "tools",
  "visibility": "public"
}
```

---

## 📂 项目结构

```
html-manager/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # 全局布局与元数据
│   │   ├── page.tsx                  # 公开画廊首页
│   │   ├── p/[slug]/                 # 交互式运行台 (多端视口模拟、全屏、源码)
│   │   ├── raw/[slug]/[[...path]]/   # 严格 CSP 沙箱直链与静态资源代理
│   │   ├── admin/                    # 管理后台 (仪表盘、项目管理表格)
│   │   │   ├── login/                # 管理员登录
│   │   │   ├── upload/               # 多模式上传入库 (拖拽、Zip、代码粘贴)
│   │   │   └── projects/[id]/edit/   # 在线 CodeMirror 编辑器与元数据微调
│   │   ├── api/
│   │   │   └── upload/               # 开放 REST API 上传端点
│   │   └── actions/                  # Next.js Server Actions (鉴权、上传、管理)
│   ├── components/                   # 公用组件 (ShowcaseGallery 等)
│   ├── db/                           # Drizzle ORM 数据模型与统一存储层
│   └── lib/
│       ├── auth.ts                   # JWT 与管理员鉴权中间件
│       ├── parser/                   # HTML 元数据提取与 Zip 自动解压
│       ├── storage/                  # 存储抽象层 (Vercel Blob / R2 / Local)
│       └── services/                 # 统一业务处理管道
├── vercel.json                       # Vercel 部署配置
└── drizzle.config.ts                 # Drizzle 迁移配置
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源发布。欢迎 Star 与 Fork，随手构建你自己的 AI 网页展厅！
