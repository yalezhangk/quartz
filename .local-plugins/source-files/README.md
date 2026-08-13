# Source Files emitter

该 emitter 仅发布已构建 `sources/*.md` 所引用的 manual 原文件。它读取 `WIKI_SOURCE_ROOT/raw/uploads/manual/`，并将文件复制到 `public/source-files/manual/`。

自动发布的 Wiki 输入是快照，因此 `wiki-backend` 必须传入 `WIKI_SOURCE_ROOT`；直接构建真实 `.../wiki` 时可从该目录的父目录推导来源根目录。
