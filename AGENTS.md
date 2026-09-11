# AGENTS.md - HTML Manager 工程与设计准则

本文档记录了 **HTML Manager** 项目的核心架构规范、设计美学与交互准则，所有协助本项目的 AI Agent 和开发者均须严格遵守。

---

## 💎 一、设计美学与视觉原则（严禁“AI 廉价味”）

本项目追求 **Vercel / Linear / shadcn/ui 官方级别** 的顶级工程美感，拒绝低质模型常见的套路化拼凑。

### 1. 坚决禁止的反模式 (Anti-Patterns)
- ❌ **严禁弥散光斑与背景光晕**：禁止使用 `blur-3xl bg-indigo-500/10` 或彩色的毛玻璃背景球。
- ❌ **严禁标题彩虹渐变**：严禁在文字标题上叠加 `bg-gradient-to-r ... bg-clip-text text-transparent`，所有文字采用清晰坚定的实体色。
- ❌ **严禁滥用 Emoji 图标**：页面分类、状态标签、按钮与导航中坚决不使用 Emoji（如 🚀, ✨, 🎮, 🛠️），统一使用 `lucide-react` 线框图标。
- ❌ **严禁臃肿大圆角与厚重阴影**：卡片与控件避免 `rounded-3xl` 或强烈的扩散投影，崇尚精致、轻薄、克制的现代工业感。

### 2. 倡导的正统设计规范 (Best Practices)
- **Monochrome & Zinc 纯粹黑白灰调**：
  - 深色模式采用精炼纯正的 Zinc 深黑基底（`#09090b`），浅色模式采用纯净白（`#ffffff`）。
  - 严格采用 1px 精细 Hairline 边框（`#27272a` / `#e4e4e7`），保持界面的精密感与技术质感。
- **全套 shadcn/ui & Radix UI 组件驱动**：
  - 页面全部交互元素必须调用 `src/components/ui/*` 规范原语：`Button`、`Badge`、`Card`、`Input`、`Tabs`、`Dialog`。
  - 组件尺寸偏向紧凑精致（32px / 36px 高度，11px~13px 字号）。
- **按需激活与 LRU 活跃池实景交互 (Hover-to-Activate with LRU Pool)**：
  - 严禁在列表/网格中直出全量 `iframe`（避免海量单页下的内存爆炸、多重沙箱并发与后台 CPU 循环空转）；
  - 展示型卡片统一采用 `HoverSandboxPreview`：默认呈现 Zinc 技术质感占位视口与 SVG 圆形加满进度环（650ms），在用户鼠标确定性悬停填满后挂载沙箱 `iframe`；
  - **全局活跃池与持久预览**：沙箱激活后在移出鼠标时保持活跃运行（便于用户同时对照浏览），全局通过 LRU 队列（`sandboxPool`）将并发活跃沙箱数上限硬限制为 **最多 6 个**；超出上限时自动淘汰最久未交互的沙箱并恢复占位态，并支持用户随时手动点击微型 `×` 释放资源；
  - 必须完整支持深色（Dark）与浅色（Light）双主题无缝切换与系统偏好联动。

---

## 🏗️ 二、核心架构与安全规范

1. **安全沙箱隔离 (Hardened Sandbox)**：
   - 托管的所有外部 HTML 运行端点统一走 `/raw/[slug]/[[...path]]`；
   - 必须强制注入 CSP 响应头：
     ```
     Content-Security-Policy: sandbox allow-scripts allow-forms allow-downloads allow-popups allow-modals; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
     X-Content-Type-Options: nosniff;
     ```
   - 宿主内的 iframe **严禁**添加 `allow-same-origin`，物理隔绝访问宿主主域的 Cookie、LocalStorage 和管理员 Session。

2. **存储适配器规范 (Storage Adapter Pattern)**：
   - 所有文件读写统一走 `getStorage()` 抽象接口，严禁直接在路由中硬编码文件系统操作；
   - 自动探测顺序：`BLOB_READ_WRITE_TOKEN` (Vercel Blob) -> `R2_*` (Cloudflare R2) -> 本地持久化 `.storage/`。

3. **数据库兼容性**：
   - 采用 Drizzle ORM，原生适配 PostgreSQL（Vercel Postgres / Neon / Supabase）；
   - 在未配置外部数据库的本地开发环境中，通过 `.data/db.json` 自动 fallback，保证开箱即用零报错。
