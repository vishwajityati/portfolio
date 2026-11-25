# features/cms-panel/

CmsPanel dashboard for managing portfolio content. All client-side (talks to API routes).

## Core

| Directory | Component | Description |
|-----------|-----------|-------------|
| `CmsPanelShell/` | `CmsPanelShell` | Top-level shell — auth state, save/logout |
| `CmsPanelDashboard/` | `CmsPanelDashboard` | Sidebar layout, section routing, dirty tracking |
| `LoginForm/` | `LoginForm` | Login + initial setup form |
| `MessageInbox/` | `MessageInbox` | Contact message list + detail view |

## Dashboard Sections

| Directory | Description |
|-----------|-------------|
| `sections/overview/` | KPI cards, activity chart, quick actions |
| `sections/portfolio/` | Content editors (about, knowledge, education, projects, experience, resume) |
| `sections/settings/` | CmsPanel account, password, 2FA, security status, SEO, site settings |
| `sections/messages/` | Message inbox wrapper |
| `sections/profile/` | Public email + location editor |
| `sections/social-links/` | Social media URL editor |
| `sections/shared/` | Reusable form components (CmsPanelField, CmsPanelTextList, SectionIntro) |
