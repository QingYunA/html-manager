<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/pagepod-logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/brand/pagepod-logo-monochrome.png">
  <img src="public/brand/pagepod-logo-monochrome.png" alt="Pagepod Logo" width="76" height="76">
</picture>

# Pagepod

<p><strong>An open-source & self-hostable showcase, hardened sandbox, and hosting platform for AI artifacts & single-page HTML apps.</strong><br>
Host, run, and showcase your Claude Artifacts, ChatGPT Canvas, v0, Bolt, and Cursor web apps on your own infrastructure — with zero build step, physical sandbox isolation, and zero egress cost.</p>

<p>
  <a href="https://github.com/QingYunA/html-manager/releases"><img src="https://img.shields.io/badge/version-1.0.0-18181b?style=flat" alt="Version"></a>
  <a href="https://hub.docker.com/"><img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker"></a>
  <a href="https://coolify.io/"><img src="https://img.shields.io/badge/Deploy%20on-Coolify-6366F1?style=flat" alt="Coolify"></a>
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FQingYunA%2Fhtml-manager&env=ADMIN_PASSWORD&envDescription=Set%20a%20master%20password%20for%20accessing%20the%20admin%20dashboard&stores=%5B%7B%22type%22%3A%22postgres%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D"><img src="https://img.shields.io/badge/Deploy%20with-Vercel-000000?style=flat&logo=vercel" alt="Deploy with Vercel"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-18181b?style=flat" alt="License"></a>
</p>

<p>
  <a href="https://pagepod.dev">Website</a> ·
  <a href="https://pagepod.dev/explore">Live Demo</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#comparison">Comparison</a> ·
  <a href="https://pagepod.dev/api/docs">API Docs</a> ·
  <a href="README_zh.md">简体中文</a>
</p>

</div>

---

## About the Project

Pagepod is an open-source, self-hostable alternative to CodePen, JSFiddle, and cloud artifact viewers — engineered specifically for the AI era.

Large language models (Claude, ChatGPT, v0, Bolt, Cursor) produce high-fidelity interactive web applications, mini-games, visual dashboards, and utility tools in seconds. However, hosting and showcasing them poses three practical challenges:

1. **Lost in chat histories:** Generative artifacts disappear once a conversation is archived or deleted.
2. **Security hazards of raw hosting:** Running untrusted, AI-generated JavaScript on your primary domain risks exposing sensitive cookies, local storage, and session tokens.
3. **Vendor lock-in and storage fees:** Public pastebins and playground platforms enforce monthly subscriptions for multi-file assets or charge bandwidth egress.

**Pagepod solves this by giving you a sovereign, self-hosted platform:**
- **No vendor lock-in:** All HTML files, assets, and database records remain on your own server or your own S3/R2 bucket.
- **Hardened iframe sandbox:** Untrusted scripts execute strictly within dedicated sandboxed endpoints with zero access to parent cookies or administrator sessions.
- **Zero build pipelines:** Drop a single `.html` file or multi-file `.zip` archive, and it runs immediately.
- **Hardware freedom:** Deploy on a $4/month VPS (Hetzner, DigitalOcean), in a Docker container via Coolify/Portainer, on a home lab / Raspberry Pi, or for free on Vercel.

---

## Self-Hosted vs. Cloud

| | Self-Hosted Pagepod (This Repo) | Pagepod Cloud (Managed) |
| :--- | :--- | :--- |
| **Pricing** | **100% Free & Open Source (MIT)** | Free & Lifetime Tiers |
| **Infrastructure** | Your own VPS, Coolify, Docker, or Vercel | Fully managed high-availability cloud |
| **Data Ownership** | 100% on your hardware or your S3/R2 | Managed cloud storage |
| **Maintenance** | Handled by you | Zero maintenance, automated backups |
| **Custom Domains** | Unlimited (via reverse proxy / Caddy) | Custom subdomain routing included |
| **Get Started** | [Follow deployment guide](#deployment) | [Visit pagepod.dev](https://pagepod.dev) |

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AI Artifact Ingestion Pipeline                        │
│                                                                             │
│  Claude Artifacts / ChatGPT Canvas / v0 / Cursor HTML Output                │
│         │                                        │                          │
│         ▼                                        ▼                          │
│   Web Console (Drag / Zip / Paste)       POST /api/upload (CLI / PAT Auth)  │
│         │                                        │                          │
│         └───────────────────┬────────────────────┘                          │
│                             ▼                                               │
│                 Pagepod Platform Core (Next.js 16)                          │
│                             │                                               │
│    ┌────────────────────────┼────────────────────────┐                      │
│    ▼                        ▼                        ▼                      │
│  Pluggable Storage    Drizzle Database       Hardened Sandbox Guard         │
│  • Local Disk Storage • PostgreSQL (Neon/DB) • CSP: script/form isolated    │
│  • Cloudflare R2 ($0) • Supabase SSR Auth    • Zero-leak memory storage     │
│  • Vercel Blob        • Local JSON Fallback  • Host cookie interception     │
│    │                        │                        │                      │
│    └────────────────────────┼────────────────────────┘                      │
│                             ▼                                               │
│         ┌───────────────────┴───────────────────┐                           │
│         ▼                                       ▼                           │
│  Showcase Gallery (/explore)            Interactive Runner (/p/[slug])      │
│  • Static blueprint dot-matrix poster   • Desktop / Tablet / Mobile toggle  │
│  • Hover-to-charge (600ms) activation   • Raw sandboxed origin (/raw/)      │
│  • LRU pool: 6 max active iframes       • Formatted source viewer + copy    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Comparison

| Feature | Pagepod (Self-Hosted) | CodePen / JSFiddle | v0 / Bolt Preview | Static S3 / R2 Bucket |
| :--- | :---: | :---: | :---: | :---: |
| **Self-Hostable on Own Hardware** | **Yes (VPS / Docker)** | No (SaaS only) | No (SaaS only) | Yes |
| **Hardened CSP Sandbox** | **Yes (`/raw/` isolated)** | Partial | Partial | No (Bucket domain risk) |
| **Multi-File Zip + Asset Mapping** | **Yes (Auto-extract)** | Paid tier only | Limited | Manual upload |
| **Responsive Viewports (Desktop/Pad/Phone)**| **Yes (1-click switch)**| Manual resize | Yes | No |
| **CLI & Agent Push API (`/api/upload`)** | **Yes (OpenAPI + PAT)**| No | No | S3 CLI only |
| **Zero Initial GPU/Memory Load** | **Yes (Poster + LRU 6)** | No (Heavy iframes) | Heavy iframes | N/A |
| **Client-Side Zero-Knowledge E2EE** | **Yes (AES-GCM)** | No | No | No |
| **Bandwidth Egress Cost** | **$0 (R2 or local disk)** | Subscription | Subscription | Cloud provider fees |

---

## Features

- **Hardened security sandbox:** Untrusted HTML executes in dedicated `/raw/[slug]/` origins protected by strict CSP directives (`sandbox allow-scripts allow-forms allow-downloads allow-popups allow-modals; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:`) without `allow-same-origin`, physically isolating host cookies, admin sessions, and local storage.
- **Static blueprint & dual-action capsule:** Renders low-overhead Zinc dot-matrix posters with category wireframes by default. Launches sandboxes on demand via 1-click or 600ms hover-charge, governed by an LRU pool capped at 6 active iframes to prevent memory exhaustion and GPU spikes.
- **Resilience shield & size guard:** Micro-badges warn visitors for files exceeding 2MB, while a 6.5-second execution timeout guard automatically halts unresponsive scripts to keep host browsing responsive.
- **Multi-format ingestion pipeline:** Ingests standalone `.html` files, multi-file `.zip` packages (with automatic relative asset extraction for images, stylesheets, and scripts), direct code pastes with intelligent `<title>`/`<meta>` extraction, and a built-in CodeMirror editor.
- **Multi-device responsive runner (`/p/[slug]`):** Real-time viewport toggling between Desktop (100%), Tablet (768px), and Mobile (375px), native browser full-screen mode, formatted source inspector with 1-click copying, and permanent shareable links.
- **OpenAPI 3.1 & Agent CLI automation:** Ship directly from Cursor, Claude Code, or terminal pipelines via `POST /api/upload` using Personal Access Tokens (`pp_live_...`). Interactive Scalar API documentation is served at `/api/docs`.
- **Zero-lock-in storage & database adapters:** Pluggable `getStorage()` layer detects local disk storage (`.storage/`), Cloudflare R2 (S3-compatible, zero egress), or Vercel Blob. Drizzle ORM supports PostgreSQL (Neon, Supabase, Vercel Postgres) with zero-config local fallback (`.data/db.json`).
- **Account-level privacy & E2EE:** Granular access control allowing artifacts to be marked Public for showcase discovery or Private for authenticated owners only. Supports client-side AES-GCM zero-knowledge encryption for sensitive tools.

---

## Deployment

Choose the deployment method that fits your infrastructure:

### 1. Docker Compose (Recommended for Self-Hosters)

Deploy on any Linux VPS (Ubuntu, Debian, Hetzner, DigitalOcean) with a single command:

```bash
# 1. Download docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/QingYunA/html-manager/main/docker-compose.yml -o docker-compose.yml

# 2. Set your admin password
sed -i 's/change_me_to_a_secure_password/your_real_password/' docker-compose.yml

# 3. Start the container
docker compose up -d
```

Pagepod is now running at `http://YOUR_SERVER_IP:3000`. Persistent files are stored in `./storage` and `./data`.

### 2. Deploy on Coolify

Deploy Pagepod inside your existing Coolify instance:

1. In the Coolify dashboard, click **+ Create New Resource** → **Public Repository**.
2. Enter the repository URL: `https://github.com/QingYunA/html-manager`.
3. Coolify will detect the included `Dockerfile`. Set the internal container port to `3000`.
4. In **Environment Variables**, add:
   ```env
   ADMIN_PASSWORD=your_secure_password
   NODE_ENV=production
   ```
5. Click **Deploy**. Coolify provisions SSL certificates and mounts the application automatically.

### 3. Deploy with Vercel (1-Click Cloud)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FQingYunA%2Fhtml-manager&env=ADMIN_PASSWORD&envDescription=Set%20a%20master%20password%20for%20accessing%20the%20admin%20dashboard&stores=%5B%7B%22type%22%3A%22postgres%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

1. Click the button above to clone the repository into your GitHub account.
2. Link free **Vercel Postgres** and **Vercel Blob** stores in the setup wizard.
3. Configure `ADMIN_PASSWORD` for console access and deploy.

### 4. Run from Source (Local or Bare Metal)

Zero-config fallback: no external database or S3 service required.

```bash
# 1. Clone repository
git clone https://github.com/QingYunA/html-manager.git
cd html-manager

# 2. Install dependencies (bun, pnpm, or npm)
bun install

# 3. Start development server
bun run dev
```

Visit `http://localhost:3000` to browse the public gallery. Access `/login` with password `admin888` for the workspace.

To run for production on bare metal:

```bash
bun run build
bun run start
```

---

## Agent & CLI Automation

Pagepod includes a RESTful API and a lightweight CLI tool so that AI coding tools (Cursor, Claude Code) and terminal scripts can deploy HTML artifacts automatically.

- **Interactive API Documentation:** Available at `/api/docs` (rendered with Scalar).
- **OpenAPI 3.1 Spec:** Available at `/api/openapi.json`.

### CLI Uploader Script

Upload an HTML artifact directly from your terminal:

```bash
node scripts/upload-cli.js ./matrix-rain.html \
  --token "YOUR_API_TOKEN" \
  --title "Matrix Rain Animation" \
  --category "visualization" \
  --endpoint "http://localhost:3000"
```

### Direct cURL File Upload

```bash
curl -X POST https://your-domain.com/api/upload \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -F "file=@demo.html" \
  -F "title=Physics Simulator" \
  -F "category=tools" \
  -F "tags=Canvas,Physics"
```

### Direct cURL JSON Code Push

```bash
curl -X POST https://your-domain.com/api/upload \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Interactive Calculator",
    "html": "<!DOCTYPE html><html><head><title>Calc</title></head><body>...</body></html>",
    "category": "tools",
    "tags": ["Utility", "Vue"]
  }'
```

**JSON Response:**

```json
{
  "success": true,
  "id": "ck89ab12cd34",
  "title": "Interactive Calculator",
  "slug": "interactive-calculator",
  "url": "https://your-domain.com/p/interactive-calculator",
  "rawUrl": "https://your-domain.com/raw/interactive-calculator/",
  "category": "tools",
  "visibility": "public"
}
```

---

## Environment Variables

Configure these keys in your `.env.local` or container environment:

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `ADMIN_PASSWORD` | **Yes** | `admin888` *(dev only)* | Master dashboard password and fallback API token. |
| `DATABASE_URL` | Production | None *(local JSON fallback)* | PostgreSQL connection string (Neon, Supabase, Vercel Postgres). |
| `BLOB_READ_WRITE_TOKEN` | Optional | None | Vercel Blob access token. |
| `R2_ACCOUNT_ID` | Optional | None | Cloudflare R2 Account ID (for $0 egress cloud storage). |
| `R2_ACCESS_KEY_ID` | Optional | None | Cloudflare R2 Access Key ID. |
| `R2_SECRET_ACCESS_KEY` | Optional | None | Cloudflare R2 Secret Access Key. |
| `R2_BUCKET_NAME` | Optional | `html-manager` | Cloudflare R2 bucket name. |
| `API_TOKEN` | Optional | Inherits `ADMIN_PASSWORD` | Dedicated token for programmatic upload authentication. |
| `SESSION_SECRET` | Optional | Fallback to password | Secret string (≥16 chars) for signing session JWT tokens. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | None | Supabase URL for multi-user Google OAuth and Email OTP. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | None | Supabase Anonymous Key for public client authentication. |

### Cloudflare R2 CORS Configuration

If using Cloudflare R2 for zero-egress object storage with direct browser uploads, add this policy in **R2 → Bucket → Settings → CORS Policy**:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Project Structure

```
html-manager/
├── Dockerfile                     # Multi-stage production container image
├── docker-compose.yml             # 1-command container deployment recipe
├── public/
│   ├── brand/                     # SVG & PNG branding assets
│   └── examples/                  # Sample HTML artifacts
├── src/
│   ├── app/
│   │   ├── (marketing)/           # Public gallery, explore, about, privacy routes
│   │   ├── api/
│   │   │   ├── docs/              # Scalar interactive API documentation
│   │   │   ├── openapi.json/      # OpenAPI 3.1 specification endpoint
│   │   │   └── upload/            # REST API upload and presign handlers
│   │   ├── p/[slug]/              # Multi-viewport interactive runner
│   │   ├── raw/[slug]/[[...path]] # Isolated CSP sandbox and static proxy
│   │   └── workspace/             # Authenticated workspace, upload & project tables
│   ├── components/
│   │   ├── hover-sandbox-preview  # Dot-matrix poster & dual-action capsule
│   │   ├── showcase-gallery.tsx   # Gallery grid with tag and category filters
│   │   └── ui/                    # shadcn/ui & Radix UI primitives
│   ├── db/                        # Drizzle schema, SQLite & Postgres drivers
│   └── lib/
│       ├── parser/                # HTML title extraction & Zip unarchiver
│       ├── storage/               # Unified storage adapter (Local / R2 / Blob)
│       └── services/              # Business logic pipelines
├── drizzle.config.ts              # Drizzle ORM configuration
└── next.config.ts                 # Next.js build and routing configuration
```

---

## Community & Contributing

Contributions are welcome. Please open an issue or pull request to discuss proposed changes:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -m 'feat: add my feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a Pull Request.

---

## License

Pagepod is released under the [MIT License](LICENSE).
