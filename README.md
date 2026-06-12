# Quartz v5

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>

## 运行
```bash
npx quartz build --serve
```

## Chats Backend Config

使用 `CHAT_PROXY_URL` 控制 chats 插件的后端基础地址。

- 本地开发：设置为 `http://127.0.0.1:8081`
- 线上部署：不设置，默认回退到 `/api`

Git Bash 示例：

```bash
export CHAT_PROXY_URL="http://127.0.0.1:8081"
npx quartz build --serve
```

如果未来本地后端端口或地址变更，只需要修改 `CHAT_PROXY_URL`，不要再改 chats 插件源码或 `proxyUrl` 默认值。
