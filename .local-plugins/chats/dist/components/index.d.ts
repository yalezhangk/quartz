import { QuartzComponent } from '@quartz-community/types';

interface ChatsSidebarOptions {
    title: string;
}
declare const _default$2: (userOpts?: Partial<ChatsSidebarOptions>) => QuartzComponent;

interface ChatPageOptions {
    proxyUrl: string;
}
declare const _default$1: (userOpts?: Partial<ChatPageOptions>) => QuartzComponent;

interface IngestPageOptions {
    proxyUrl: string;
}
declare const _default: (userOpts?: Partial<IngestPageOptions>) => QuartzComponent;

export { _default$1 as ChatPage, _default$2 as Chats, _default as IngestPage };
