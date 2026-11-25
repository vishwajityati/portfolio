export interface Knowledge {
  name: string;
  /**
   * Self-assessed proficiency, 0–100.
   *
   * The public bar is drawn from stepped CSS classes rather than an inline `width`, so the value
   * is snapped to the nearest 5 to guarantee a matching class always exists. That keeps
   * `style-src-attr 'none'` intact — see `.knowledge-bar-*` in features/portfolio/knowledge/Knowledge.css.
   */
  level: number;
}

export interface KnowledgeGroup {
  title: string;
  knowledge: Knowledge[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  summary: string;
  knowledgeGroups: KnowledgeGroup[];
  beyond: string;
}
