import { QuartzPageTypePlugin } from '@quartz-community/types';
export { ChatPage, Chats, IngestPage } from './components/index.js';

interface ChatPageTypeOptions {
    title?: string;
    proxyUrl?: string;
    ingestPollIntervalMs?: number;
}
declare const ChatPageType: QuartzPageTypePlugin<ChatPageTypeOptions>;

interface Chat {
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
    last_message_at: string | null;
    last_message_preview: string | null;
}
interface ChatMessage {
    id: number;
    chat_id: string;
    role: "user" | "assistant";
    content: string;
    sources: string[];
    relevant_pages: string[];
    created_at: string;
    synthesis_path: string | null;
    synthesized_at: string | null;
}
interface ChatMessagesResponse {
    chat: Chat;
    messages: ChatMessage[];
}
interface ChatTurnResponse {
    chat: Chat;
    user_message: ChatMessage;
    assistant_message: ChatMessage;
}
interface ChatSessionData {
    intent?: "new" | {
        mode: "chat";
        id: string;
    };
}

export { type Chat, type ChatMessage, type ChatMessagesResponse, ChatPageType, type ChatSessionData, type ChatTurnResponse };
