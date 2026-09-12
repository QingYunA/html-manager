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
- **静态底图与双核悬浮胶囊操作体系 (Static Poster with Dual-Action Capsule & Resilience Shield)**：
  - **严禁在列表/网格中无差别直出全量 iframe**（彻底避免多重并发大型 HTML/WebGL 造成的 GPU/CPU 峰值、风扇狂转与内存爆炸）；
  - 展示型卡片统一采用 `HoverSandboxPreview`：默认呈现 Zinc 高定技术点阵底图与分类专属线框海报（零网络开销、首屏极速加载）；
  - **双核悬浮胶囊工具栏 (Floating Action Capsule)**：
    - **左侧【预览 / 悬停预览】**：支持直接点击立即运行，或悬停 600ms 环形进度蓄力载入；沙箱启动后胶囊栏收缩为微型运行徽章（绿点呼吸灯 + `×` 暂停按钮）；
    - **右侧【打开】**：快速在新标签页进入全屏独立运行台 `/p/[slug]`；
  - **超大/复杂/异常 HTML 防护体系**：
    - **体积预警**：文件 > 2MB 时右上角标注体积微胶囊，并在预览前提示推荐全屏打开；
    - **超时与异常守护**：6.5s 加载超时自动阻断并提示友好告警与直接打开；捕获脚本致命异常，保障主站性能不受拖累；
  - **全局活跃池与持久预览**：全局通过 LRU 队列（`sandboxPool`）将并发活跃沙箱数上限硬限制为 **最多 6 个**；超出上限时自动淘汰最久未交互的沙箱并恢复静态底图态，并支持用户随时手动点击微型 `×` 释放资源；
  - 必须完整支持深色（Dark）与浅色（Light）双主题无缝切换与系统偏好联动。

### 3. 动态交互与加载动效规范 (Motion & Loading Standards)
- **Tailwind v4 旋转动画防死锁准则**：
  - Tailwind v4 默认 `@keyframes spin` 仅声明 `to { transform: rotate(360deg); }`，在 Chromium/WebKit 内核下会因矩阵等价分解导致动画冻结（出现加载图标静止不转的圆圈 Bug）。
  - 全局样式 `globals.css` 必须显式声明包含 `from { transform: rotate(0deg); }` 与 `to { transform: rotate(360deg); }` 的完整关键帧，并为 `.animate-spin` 设置 `transform-origin: center;`。
- **Radix UI / shadcn 进出场平滑过渡**：
  - 必须启用 `@plugin "tailwindcss-animate";`，严禁让 `Dialog`、`Toast`、`DropdownMenu` 失去进出场过渡；
  - 弹窗必须具备微缩放（`zoom-in-95`）与淡入（`fade-in-0`），Toast 反馈必须具备平滑滑入（`slide-in-from-bottom-3`）与淡入，禁止生硬弹跳。
- **异步操作按钮统一 Loading 反馈**：
  - 任何触发异步请求或 Server Action 的确认/提交按钮（删除、生成、撤销、登录等），在 `isPending` 时必须统一渲染精致的 `<Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />`，提供明确的视觉反馈，不可仅改变静态文本。
- **列表删除项过渡态**：
  - 在卡片或表格列表执行删除时，被操作项在执行期间必须即时呈现半透明过渡态（如 `opacity-40 scale-[0.98] pointer-events-none transition-all duration-200`），避免直接生硬截断移除。

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
