import {
  Code2,
  Database,
  Monitor,
  Plus,
  Server,
  Trash2,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PortfolioContent } from "@/types";
import { snapKnowledgeLevel } from "@/lib/validations";
import { SectionIntro } from "@/features/cms-panel/sections/shared/SectionIntro";

import "./KnowledgeSection.css";

type KnowledgeCategory = {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
};
type KnowledgeGroup =
  PortfolioContent["education"][number]["knowledgeGroups"][number];

const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  {
    key: "frontend",
    title: "Frontend",
    description: "User interfaces and client-side development",
    icon: <Monitor size={16} />,
  },
  {
    key: "backend",
    title: "Backend",
    description: "Server-side development and APIs",
    icon: <Server size={16} />,
  },
  {
    key: "programming",
    title: "Programming Languages",
    description: "Languages used for development and problem solving",
    icon: <Code2 size={16} />,
  },
  {
    key: "database",
    title: "Database & Tools",
    description: "Databases, ORM, version control and development tools",
    icon: <Database size={16} />,
  },
];

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findExistingGroup(
  groups: KnowledgeGroup[],
  category: KnowledgeCategory,
  index: number,
): KnowledgeGroup {
  const normalizedCategory = normalizeTitle(category.title);

  const exactMatch = groups.find((group) => {
    const normalizedGroup = normalizeTitle(group.title);

    if (normalizedGroup === normalizedCategory) {
      return true;
    }

    if (
      category.key === "frontend" &&
      (normalizedGroup.includes("frontend") ||
        normalizedGroup.includes("front end"))
    ) {
      return true;
    }

    if (
      category.key === "backend" &&
      (normalizedGroup.includes("backend") ||
        normalizedGroup.includes("back end"))
    ) {
      return true;
    }

    if (
      category.key === "programming" &&
      (normalizedGroup.includes("program") ||
        normalizedGroup.includes("language") ||
        normalizedGroup.includes("coding"))
    ) {
      return true;
    }

    if (
      category.key === "database" &&
      (normalizedGroup.includes("database") ||
        normalizedGroup.includes("database tools") ||
        normalizedGroup.includes("tools"))
    ) {
      return true;
    }

    return false;
  });

  if (exactMatch) {
    return {
      ...exactMatch,
      title: category.title,
    };
  }

  // If old data does not have recognizable category names,
  // preserve the existing order as a fallback.
  const fallbackGroup = groups[index];

  if (fallbackGroup) {
    return {
      ...fallbackGroup,
      title: category.title,
    };
  }

  return {
    title: category.title,
    knowledge: [],
  };
}

export function KnowledgeSection({
  content,
  onChange,
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const education = content.education[0] ?? { degree: "", institution: "", period: "", summary: "", knowledgeGroups: [], beyond: "" };
  const existingGroups = education.knowledgeGroups;

  /*
   * Always expose exactly four categories in the Admin dashboard.
   *
   * The stored data still uses education.knowledgeGroups, so this change
   * does not require a database migration.
   */
  const groups = KNOWLEDGE_CATEGORIES.map((category, index) =>
    findExistingGroup(existingGroups, category, index),
  );

  const updateGroups = (next: KnowledgeGroup[]) => {
    onChange({
      ...content,
      education: content.education.length > 0
        ? [{ ...education, knowledgeGroups: next }, ...content.education.slice(1)]
        : [{ ...education, knowledgeGroups: next }],
    });
  };

  const updateGroup = (
    groupIndex: number,
    patch: Partial<KnowledgeGroup>,
  ) => {
    const nextGroups = groups.map((group, index) =>
      index === groupIndex
        ? {
            ...group,
            ...patch,
            // Category names are controlled by the system.
            title: KNOWLEDGE_CATEGORIES[index].title,
          }
        : group,
    );

    updateGroups(nextGroups);
  };

  const updateKnowledge = (
    groupIndex: number,
    knowledgeIndex: number,
    patch: Partial<KnowledgeGroup["knowledge"][number]>,
  ) => {
    const nextGroups = groups.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        title: KNOWLEDGE_CATEGORIES[index].title,
        knowledge: group.knowledge.map((knowledge, position) =>
          position === knowledgeIndex
            ? {
                ...knowledge,
                ...patch,
              }
            : knowledge,
        ),
      };
    });

    updateGroups(nextGroups);
  };

  const addKnowledge = (groupIndex: number) => {
    const nextGroups = groups.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        title: KNOWLEDGE_CATEGORIES[index].title,
        knowledge: [
          ...group.knowledge,
          {
            name: "New knowledge",
            level: 75,
          },
        ],
      };
    });

    updateGroups(nextGroups);
  };

  const removeKnowledge = (
    groupIndex: number,
    knowledgeIndex: number,
  ) => {
    const nextGroups = groups.map((group, index) => {
      if (index !== groupIndex) {
        return group;
      }

      return {
        ...group,
        title: KNOWLEDGE_CATEGORIES[index].title,
        knowledge: group.knowledge.filter(
          (_, position) => position !== knowledgeIndex,
        ),
      };
    });

    updateGroups(nextGroups);
  };

  return (
    <>
      
        <div className="knowledge-admin-grid">
        {KNOWLEDGE_CATEGORIES.map((category, groupIndex) => {
          const group = groups[groupIndex];

          return (
            <section
              className="knowledge-admin-card"
              key={category.key}
            >
              {/* Category header */}
              <div className="knowledge-admin-card-header">
                <div className="knowledge-admin-card-icon">
                  {category.icon}
                </div>

                <div className="knowledge-admin-card-title">
                  <span className="knowledge-admin-number">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>

                  <h3>{category.title}</h3>

                  <p>{category.description}</p>
                </div>

                <button
                  className="button button-quiet content-add-button"
                  type="button"
                  onClick={() => addKnowledge(groupIndex)}
                >
                  <Plus size={14} />
                  Add knowledge
                </button>
              </div>

              {/* Divider */}
              <div className="knowledge-admin-divider" />

              {/* Knowledge */}
              {group.knowledge.length === 0 ? (
                <div className="knowledge-admin-empty">
                  <Wrench size={15} />
                  <span>No knowledge added yet.</span>
                </div>
              ) : (
                <div className="knowledge-admin-list">
                  {group.knowledge.map((knowledge, knowledgeIndex) => (
                    <div
                      className="knowledge-admin-row"
                      key={`${category.key}-${knowledgeIndex}`}
                    >
                      <div className="knowledge-admin-knowledge-number">
                        {String(knowledgeIndex + 1).padStart(2, "0")}
                      </div>

                      <div className="knowledge-admin-name">
                        <label
                          htmlFor={`knowledge-${groupIndex}-${knowledgeIndex}`}
                        >
                          Knowledge
                        </label>

                        <input
                          id={`knowledge-${groupIndex}-${knowledgeIndex}`}
                          value={knowledge.name}
                          placeholder={
                            category.key === "frontend"
                              ? "React"
                              : category.key === "backend"
                                ? "Node.js"
                                : category.key === "programming"
                                  ? "Java"
                                  : "PostgreSQL"
                          }
                          onChange={(event) =>
                            updateKnowledge(
                              groupIndex,
                              knowledgeIndex,
                              {
                                name: event.target.value,
                              },
                            )
                          }
                        />
                      </div>

                      <div className="knowledge-admin-level">
                        <label
                          htmlFor={`level-${groupIndex}-${knowledgeIndex}`}
                        >
                          Level
                        </label>

                        <div className="knowledge-admin-level-input">
                          <input
                            id={`level-${groupIndex}-${knowledgeIndex}`}
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={knowledge.level}
                            onChange={(event) =>
                              updateKnowledge(
                                groupIndex,
                                knowledgeIndex,
                                {
                                  level: snapKnowledgeLevel(
                                    event.target.value,
                                  ),
                                },
                              )
                            }
                          />

                          <span>%</span>
                        </div>
                      </div>

                      <button
                        className="content-icon-button knowledge-admin-delete"
                        type="button"
                        aria-label={`Remove ${
                          knowledge.name || "knowledge"
                        }`}
                        onClick={() =>
                          removeKnowledge(
                            groupIndex,
                            knowledgeIndex,
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
