type FilePath = string;
interface QuartzEmitterContext {
    argv: {
        directory: string;
        output: string;
    };
}
interface QuartzEmitterPlugin {
    (): {
        name: string;
        emit: (context: QuartzEmitterContext, content: unknown) => AsyncGenerator<FilePath, void, undefined>;
        partialEmit: () => AsyncGenerator<never, void, undefined>;
    };
}
declare const SourceFiles: QuartzEmitterPlugin;

export { SourceFiles, SourceFiles as default };
