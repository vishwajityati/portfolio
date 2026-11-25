export interface Knowledge {
  name: string;
  level: number;
}

export interface KnowledgeGroup {
  title: string;
  knowledge: Knowledge[];
}

export interface KnowledgeSet {
  frontend: Knowledge[];
  backend: Knowledge[];
  programmingLanguages: Knowledge[];
  databaseTools: Knowledge[];
}