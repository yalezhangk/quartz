import { QuartzPageTypePlugin } from '@quartz-community/types';

type KnowledgeObjectType = "source" | "entity" | "concept" | "synthesis";
interface KnowledgeObject {
    slug: string;
    title: string;
    type: KnowledgeObjectType;
    code: "SRC" | "ENT" | "CON" | "SYN";
    description: string;
    hasDescription: boolean;
    tags: string[];
    updatedAt: Date | null;
    sourceFile: string | null;
    sourceUrl: string | null;
}

declare const KnowledgePageType: QuartzPageTypePlugin;

export { type KnowledgeObject, type KnowledgeObjectType, KnowledgePageType };
