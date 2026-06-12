import { QuartzPageTypePlugin } from '@quartz-community/types';
export { ChatPage, Chats } from './components/index.js';

interface ChatPageTypeOptions {
    title?: string;
    proxyUrl?: string;
}
declare const ChatPageType: QuartzPageTypePlugin<ChatPageTypeOptions>;

interface Conversation {
    id: string;
    title: string;
    lastMessage?: string;
    updatedAt: string;
    messageCount: number;
}
interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}
interface ChatSessionData {
    intent?: "new" | {
        mode: "chat";
        id: string;
    };
}

export { ChatPageType, type ChatSessionData, type Conversation, type Message };
