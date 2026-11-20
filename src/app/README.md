# app/

Next.js App Router. All pages are `force-dynamic` (server-rendered per request).

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Home — renders the public portfolio |
| `/resume` | `resume/page.tsx` | Printable resume |
| `/cms-panel` | `cms-panel/page.tsx` | CmsPanel dashboard (noindex, no-cache) |
| `/preview/3d` | `preview/3d/page.tsx` | Local 3D hero design preview |

## API Routes

| Route | Description |
|-------|-------------|
| `api/auth/*` | Login, logout, setup, account, TOTP, status |
| `api/messages/*` | Contact form messages (GET, POST, PATCH, DELETE) |
| `api/portfolio` | Portfolio content (GET, PUT) |
| `api/cms-panel/security` | Security posture overview |
| `api/upload/token` | Vercel Blob upload token |

## Other

- `layout.tsx` — Root layout with metadata generation
- `globals.css` — Single stylesheet entry point (imports all others)
- `robots.ts` — robots.txt generator
