import type { PortfolioContent } from "@/types";
import { CmsPanelField } from "@/features/cms-panel/sections/shared/CmsPanelField";
import { SectionIntro } from "@/features/cms-panel/sections/shared/SectionIntro";

export function ProfileSection({ content, onChange }: { content: PortfolioContent; onChange: (content: PortfolioContent) => void }) {
  const update = (patch: Partial<PortfolioContent["contact"]>) => onChange({
    ...content,
    location: patch.location ?? content.location,
    contact: { ...content.contact, ...patch, location: patch.location ?? content.contact.location }
  });
  return (
    <>
      <SectionIntro
          step="PUBLIC PROFILE"
          title="Manage your public contact details."
          description="Update the email address and location displayed on your public portfolio."
        />
      <div className="content-fields-grid">
        <CmsPanelField label="Public email" value={content.contact.email} onChange={(email) => update({ email })} type="email" placeholder="you@example.com" />
        <CmsPanelField label="Location" value={content.location} onChange={(location) => update({ location })} placeholder="City, Country" />
      </div>
    </>
  );
}
