# Project Structure

```
portfolio/
├── prisma/
│   ├── schema.prisma          # Database models (Portfolio, CmsPanel, LoginAttempt, ContactMessage)
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script
├── public/                    # Static assets (images, fonts, icons)
├── src/
│   ├── middleware.ts           # Next.js middleware (CSP nonce, /cms-panel redirect)
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (metadata, fonts)
│   │   ├── page.tsx            # Home page (/)
│   │   ├── globals.css         # Stylesheet entry point
│   │   ├── robots.ts           # robots.txt
│   │   ├── cms-panel/             # CmsPanel dashboard pages
│   │   │   └── page.tsx        #   CmsPanel shell (noindex)
│   │   ├── resume/             # Resume page
│   │   │   └── page.tsx        #   Printable resume
│   │   ├── preview/3d/         # 3D hero preview
│   │   │   └── page.tsx        #   Local design preview
│   │   └── api/                # API routes
│   │       ├── auth/           #   Login, logout, setup, account, TOTP, status
│   │       ├── messages/       #   Contact messages (CRUD)
│   │       ├── portfolio/      #   Portfolio content (GET, PUT)
│   │       ├── cms-panel/security/ #   Security posture
│   │       └── upload/token/   #   Vercel Blob upload token
│   ├── features/
│   │   ├── portfolio/          # Public portfolio
│   │   │   ├── PortfolioApp.tsx #   Main composer
│   │   │   ├── hero/            #   Hero + 3D orb
│   │   │   ├── about/           #   About section
│   │   │   ├── skills/          #   Skills cards
│   │   │   ├── education/       #   Education timeline
│   │   │   ├── projects/        #   Projects grid
│   │   │   ├── experience/      #   Experience timeline
│   │   │   ├── contact/         #   Contact + form + footer
│   │   │   ├── navigation/      #   Bottom nav
│   │   │   ├── background/      #   Animated canvas background
│   │   │   └── resume/          #   Resume view
│   │   └── cms-panel/              # CmsPanel dashboard
│   │       ├── CmsPanelShell/      #   Top-level shell (auth, save)
│   │       ├── CmsPanelDashboard/  #   Sidebar layout + routing
│   │       ├── LoginForm/       #   Login + setup form
│   │       ├── MessageInbox/    #   Message list + detail
│   │       ├── sections/        #   Dashboard sections
│   │       │   ├── overview/    #     KPI cards, activity
│   │       │   ├── portfolio/   #     Content editors
│   │       │   ├── settings/    #     Account, password, 2FA, SEO
│   │       │   ├── messages/    #     Inbox wrapper
│   │       │   ├── profile/     #     Email + location
│   │       │   ├── social-links/#     Social URLs
│   │       │   └── shared/      #     Reusable form components
│   │       └── CmsPanel.css        #   CmsPanel base styles
│   ├── hooks/                  # Custom React hooks
│   │   ├── useActiveSection.ts #   Track visible section
│   │   └── useScrollAnimation.ts#   Reveal on scroll
│   ├── lib/                    # Utilities, configs, security
│   │   ├── prisma.ts           #   Prisma singleton
│   │   ├── portfolio.ts        #   Content CRUD
│   │   ├── auth.ts             #   Session config
│   │   ├── auth-rate-limit.ts  #   Rate limiting
│   │   ├── access-code.ts      #   Access code policy
│   │   ├── security.ts         #   CSRF, size checks
│   │   ├── security-headers.ts #   CSP + headers
│   │   ├── security-types.ts   #   Security API types
│   │   ├── permissions.ts      #   CmsPanel access check
│   │   ├── totp.ts             #   2FA implementation
│   │   ├── contact-email.ts    #   SMTP email
│   │   ├── db-retry.ts         #   Retry with backoff
│   │   ├── validations.ts      #   Content validation
│   │   └── api.ts              #   Fetch wrapper
│   ├── services/               # Service layer
│   │   └── portfolio.service.ts#   Portfolio API service
│   ├── types/                  # TypeScript types
│   │   ├── index.ts            #   Barrel export + main types
│   │   ├── project.ts          #   Project type
│   │   ├── skills.ts           #   Skill types
│   │   ├── experience.ts       #   Experience type
│   │   └── education.ts        #   Education type
│   ├── data/                   # Static seed data
│   │   ├── personal.ts         #   Default content
│   │   ├── projects.ts         #   Default projects
│   │   ├── experience.ts       #   Default experience
│   │   ├── education.ts        #   Default education
│   │   └── navigation.ts       #   Nav items
│   └── styles/                 # Global stylesheets
│       ├── theme.css           #   CSS variables
│       ├── reset.css           #   Element resets
│       ├── buttons.css         #   Button primitives
│       ├── reveal.css          #   Scroll reveal
│       ├── keyframes.css       #   Animations
│       └── responsive.css      #   Breakpoints + print
├── scripts/                    # Build & utility scripts
├── docs/                       # Documentation
├── next.config.ts              # Next.js config
├── package.json
├── tsconfig.json
└── README.md
```

## Key Patterns

- **All pages are `force-dynamic`** — server-rendered per request
- **Singleton database rows** — Portfolio and CmsPanel both use `id: 1`
- **Security-first** — CSP with nonces, httpOnly cookies, bcrypt, TOTP 2FA, rate limiting, CSRF origin checks
- **Feature-based organization** — each feature owns its components, hooks, and styles
- **Server-only imports** — sensitive lib files use `import "server-only"`
