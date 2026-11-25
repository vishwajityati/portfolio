"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  House,
  Layers,
  Mail,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { navigationItems } from "@/data/navigation";
import "./BottomNav.css";

const navigationIcons: Record<
  (typeof navigationItems)[number]["id"],
  typeof House
> = {
  home: House,
  about: UserRound,
  knowledge: Layers,
  education: GraduationCap,
  projects: FolderKanban,
  experience: BriefcaseBusiness,
  contact: Mail,
};

// The four destinations that stay on the mobile tab bar; everything else lives in the menu.
const primaryIds = ["home", "about", "projects", "contact"] as const;

export function BottomNav({ active }: { active: string }) {
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const primaryItems = navigationItems.filter(({ id }) =>
    (primaryIds as readonly string[]).includes(id)
  );

  const sectionsActive = navigationItems.some(
    ({ id }) => !primaryIds.includes(id as (typeof primaryIds)[number]) && active === id
  );

  const navigateToSection =
    (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();

      setSectionsOpen(false);

      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

  const closeSections = () => {
    setSectionsOpen(false);
    menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!sectionsOpen) return;

    // A class (rather than an inline style) keeps this compatible with the strict CSP.
    document.body.classList.add("nav-menu-open");
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSections();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("nav-menu-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sectionsOpen]);

  return (
    <>
      <nav className="bottom-nav" aria-label="Main navigation">
        {/* Desktop: every section in one pill. */}
        <div className="desktop-navigation">
          {navigationItems.map(({ id, label }) => {
            const Icon = navigationIcons[id];

            return (
              <a
                key={id}
                className={`nav-link ${active === id ? "active" : ""}`}
                href={`#${id}`}
                onClick={navigateToSection(id)}
                aria-label={label}
                aria-current={active === id ? "location" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={16} strokeWidth={1.8} />
                </span>

                <span className="nav-label">{label}</span>
              </a>
            );
          })}
        </div>

        {/* Mobile: four primary destinations plus the section menu. */}
        <div className="mobile-navigation">
          {primaryItems.map(({ id, label }) => {
            const Icon = navigationIcons[id];

            return (
              <a
                key={id}
                className={`mobile-nav-button ${active === id ? "active" : ""}`}
                href={`#${id}`}
                onClick={navigateToSection(id)}
                aria-label={label}
                aria-current={active === id ? "location" : undefined}
              >
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </a>
            );
          })}

          <button
            ref={menuButtonRef}
            className={`mobile-nav-button mobile-nav-more ${
              sectionsOpen || sectionsActive ? "active" : ""
            }`}
            type="button"
            aria-label="More sections"
            aria-haspopup="dialog"
            aria-expanded={sectionsOpen}
            aria-controls="mobile-nav-sheet"
            onClick={() => setSectionsOpen((open) => !open)}
          >
            <Menu size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* The sheet is a sibling of the transformed nav so its fixed backdrop covers the viewport. */}
      <button
        className="mobile-nav-backdrop"
        type="button"
        aria-label="Close navigation menu"
        tabIndex={sectionsOpen ? 0 : -1}
        hidden={!sectionsOpen}
        onClick={closeSections}
      />

      <div
        className="mobile-nav-sheet"
        id="mobile-nav-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
        hidden={!sectionsOpen}
      >
        <div className="mobile-nav-handle" aria-hidden="true" />

        <div className="mobile-nav-sheet-header">
          <h2 className="mobile-nav-sheet-title" id="mobile-nav-title">
            Navigate
          </h2>

          <button
            ref={closeButtonRef}
            className="mobile-nav-close"
            type="button"
            aria-label="Close navigation menu"
            onClick={closeSections}
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <nav className="mobile-nav-grid" aria-label="All sections">
          {navigationItems.map(({ id, label }) => {
            const Icon = navigationIcons[id];

            return (
              <a
                key={id}
                href={`#${id}`}
                className={active === id ? "active" : undefined}
                aria-current={active === id ? "location" : undefined}
                onClick={navigateToSection(id)}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
}
