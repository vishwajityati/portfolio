import {
  ChevronDown,
  Download,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { PortfolioContent } from "@/types";
import { HeroOrb } from "./HeroOrb";
import "./hero.css";

function toTitleCase(value: string): string {
  if (!value) return "";
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function Hero({ content }: { content: PortfolioContent }) {
  const [resumeMenuOpen, setResumeMenuOpen] = useState(false);
  const [roleIndex, setRoleIndex] = useState(0);
  const nameWords = content.name.split(" ").filter(Boolean);
  const firstName = nameWords[0] ?? "";
  const lastName = nameWords.slice(1).join(" ");

  useEffect(() => {
    if (!content.roles.length) return;

    const interval = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % content.roles.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [content.roles]);

  const socialLinks = [
    { href: content.contact.github, icon: Github, label: "GitHub" },
    { href: content.contact.linkedin, icon: Linkedin, label: "LinkedIn" },
    { href: content.contact.x, icon: Twitter, label: "Twitter" },
    { href: content.contact.instagram, icon: Instagram, label: "Instagram" },
  ]
    .filter(({ href }) => href)
    .slice(0, 4);

  return (
    <section className="hero section-shell" id="home">
      <div className="hero-copy">
        <h1>
          <span className="hero-name-primary">{toTitleCase(firstName)}</span>
          {lastName && (
            <>
              <br />
              <span className="gradient-text">{toTitleCase(lastName)}</span>
            </>
          )}
        </h1>
        <div className="hero-actions">
          <a
            className="button button-primary"
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
              window.history.replaceState(null, "", `${window.location.pathname}#contact`);
            }}
          >
            Get In Touch
          </a>
          <div className="resume-menu">
            <button
              className="button button-quiet"
              onClick={() => setResumeMenuOpen(!resumeMenuOpen)}
              aria-expanded={resumeMenuOpen}
            >
              Resume
              <ChevronDown size={15} />
            </button>

            {resumeMenuOpen && (
              <div className="resume-dropdown">
                <a
                  href={content.resumeUrl || "/resume"}
                  target="_blank"
                  rel="noreferrer"
                  className="resume-option"
                >
                  <ExternalLink size={14} />
                  View Resume
                </a>

                <a
                  href={content.resumeUrl || "/resume"}
                  download
                  className="resume-option"
                >
                  <Download size={14} />
                  Download Resume
                </a>
              </div>
            )}
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="hero-socials">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="hero-social-link"
              >
                <Icon size={18} strokeWidth={1.8} />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="hero-scroll-indicator" aria-hidden="true">
        <span>Scroll</span>
        <ChevronDown size={16} />
      </div>

      <HeroOrb />
    </section>
  );
}
