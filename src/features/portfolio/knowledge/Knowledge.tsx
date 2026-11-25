import {
  Monitor,
  Server,
  Code2,
  Database,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PortfolioContent } from "@/types";
import "./Knowledge.css";

type KnowledgeCategory = {
  number: string;
  title: string;
  icon: ReactNode;
  knowledge: PortfolioContent["education"][number]["knowledgeGroups"][number]["knowledge"];
};

const categoryIcons = [
  <Monitor key="frontend" size={19} strokeWidth={1.8} />,
  <Server key="backend" size={19} strokeWidth={1.8} />,
  <Code2 key="programming" size={19} strokeWidth={1.8} />,
  <Database key="database" size={19} strokeWidth={1.8} />,
];

function getDots(level?: number) {
  if (typeof level !== "number") return 1;

  if (level >= 80) return 3;
  if (level >= 50) return 2;

  return 1;
}

function KnowledgeCard({
  category,
  index,
}: {
  category: KnowledgeCategory;
  index: number;
}) {
  return (
    <article
      className="knowledge-card "
      // className={`knowledge-card reveal reveal-delay-tight-${Math.min(
      //   index,
      //   3
      // )}`}
    >
      <div className="knowledge-card-header">
        <div className="knowledge-card-icon">
          {category.icon}
        </div>

        <div className="knowledge-card-heading">
          <h3>{category.title.toUpperCase()}</h3>
        </div>
      </div>

      <div className="knowledge-card-divider" />

      <div className="knowledge-list">
        {category.knowledge.map((knowledge, knowledgeIndex) => {
          const dots = getDots(knowledge.level);

          return (
            <div
              className="knowledge-item"
              key={`${knowledge.name}-${knowledgeIndex}`}
            >
              <span className="knowledge-name">
                {knowledge.name || "Unnamed knowledge"}
              </span>

              <span className="knowledge-indicator">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className={`knowledge-dot ${
                      dot < dots ? "active" : ""
                    }`}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function Knowledge({
  content,
}: {
  content: PortfolioContent;
}) {
  const knowledgeCategories: KnowledgeCategory[] =
    (content.education[0]?.knowledgeGroups ?? []).map((group, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: group.title,
      icon: categoryIcons[index] ?? <Database size={19} strokeWidth={1.8} />,
      knowledge: group.knowledge,
    }));

  return (
    <section
      className="knowledge section-shell section-block"
      id="knowledge"
    >
      <div className="section-kicker reveal">
        
        <span>KNOWLEDGE</span>
        <i />
      </div>

      <div className="section-heading reveal">
        <div>

          <h2>
            Knowledge  I{" "} 
            <span className="gradient-text">Learning.</span>
          </h2>
        </div>
      </div>

      <div className="knowledge-grid">
        {knowledgeCategories.length === 0
          ? <p className="empty-state">Knowledge is on its way. Check back soon.</p>
          : knowledgeCategories.map((category, index) => (
              <KnowledgeCard
                key={category.title}
                category={category}
                index={index}
              />
            ))}
      </div>
    </section>
  );
}
