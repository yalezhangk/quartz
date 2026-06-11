import { QuartzComponent } from '@quartz-community/types';

interface ChatsSidebarOptions {
    title: string;
}
declare const _default$1: (userOpts?: Partial<ChatsSidebarOptions>) => QuartzComponent;

interface ChatPageOptions {
    proxyUrl: string;
}
declare const _default: (userOpts?: Partial<ChatPageOptions>) => QuartzComponent;

export { _default as ChatPage, _default$1 as Chats };
