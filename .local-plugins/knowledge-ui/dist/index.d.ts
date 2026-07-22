import { QuartzPageTypePlugin } from '@quartz-community/types';

declare const KnowledgePageType: QuartzPageTypePlugin;

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
}

export { type KnowledgeObject, type KnowledgeObjectType, KnowledgePageType };
