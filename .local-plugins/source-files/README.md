# Source Files emitter

该 emitter 仅发布已构建 `sources/*.md` 显式引用的原文件，不会扫描或发布整个 `raw/`。`raw/uploads/manual/<path>` 会复制到 `public/source-files/manual/<path>`；其他安全的 `raw/<path>` 历史引用会复制到 `public/source-files/legacy/<path>`。它拒绝非 `raw/` 引用、路径穿越、绝对路径、反斜杠、目录、缺失文件和符号链接。

自动发布的 Wiki 输入是快照，因此 `wiki-backend` 必须传入 `WIKI_SOURCE_ROOT`；直接构建真实 `.../wiki` 时可从该目录的父目录推导来源根目录。
