# features/portfolio/

Public portfolio website. Composed by `PortfolioApp.tsx`.

## Sections

| Directory | Component | Description |
|-----------|-----------|-------------|
| `hero/` | `Hero` | Name, rotating roles, resume dropdown, 3D orb |
| `about/` | `About` | Portrait + about paragraphs |
| `knowledge/` | `Knowledge` | Knowledge category cards with proficiency dots |
| `education/` | `Education` | Degree cards with timeline |
| `projects/` | `Projects` | Featured project + grid of project cards |
| `experience/` | `Experience` | Timeline of roles with bullet points |
| `contact/` | `Contact` | Contact info, social links, contact form |
| `navigation/` | `BottomNav` | Fixed bottom nav (desktop + mobile) |
| `background/` | `AnimatedBackground` | Canvas green-dot network (shared by all pages) |
| `resume/` | `ResumeView` | Printable resume page |

## Entry Point

`PortfolioApp.tsx` — Composes all sections with scroll animation and active section tracking.
