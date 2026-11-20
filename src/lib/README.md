# lib/

Utilities, configs, security, and validation. No React components here.

| File | Purpose |
|------|---------|
| `prisma.ts` | Singleton PrismaClient |
| `portfolio.ts` | Portfolio content CRUD (seed, read, save) |
| `auth.ts` | iron-session config + session getter |
| `auth-rate-limit.ts` | Rate limiting (login + contact) via Prisma |
| `access-code.ts` | Access code policy (length, variety, blacklist) |
| `security.ts` | Client address, size checks, same-origin check |
| `security-headers.ts` | CSP builder + static security headers |
| `security-types.ts` | Security posture API types |
| `permissions.ts` | `hasCmsPanelAccess()` — session + version check |
| `totp.ts` | TOTP (2FA) — generate, encrypt, verify |
| `contact-email.ts` | SMTP email sending via nodemailer |
| `db-retry.ts` | Transient DB error detection + retry with backoff |
| `validations.ts` | Portfolio content validation + normalization |
| `api.ts` | Fetch wrapper for client-side API calls |
