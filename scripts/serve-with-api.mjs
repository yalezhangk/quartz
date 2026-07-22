import { createServer, request as createProxyRequest } from "node:http"
import { createReadStream } from "node:fs"
import { join } from "node:path"
import process from "node:process"
import serveHandler from "serve-handler"

const host = "127.0.0.1"
const port = Number.parseInt(process.env.QUARTZ_PREVIEW_PORT ?? "8080", 10)
const publicDirectory = process.env.QUARTZ_PUBLIC_DIRECTORY ?? "public"
const apiTarget = new URL(process.env.QUARTZ_API_TARGET ?? "http://127.0.0.1:8081")

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("QUARTZ_PREVIEW_PORT must be a valid TCP port")
}

function proxyApi(request, response) {
  const targetUrl = new URL(request.url ?? "/api/", apiTarget)
  const headers = { ...request.headers, host: apiTarget.host }
  delete headers.connection

  const proxyRequest = createProxyRequest(
    targetUrl,
    {
      method: request.method,
      headers,
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers)
      proxyResponse.pipe(response)
    },
  )

  proxyRequest.on("error", (error) => {
    if (response.headersSent) {
      response.destroy(error)
      return
    }
    response.writeHead(502, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    })
    response.end(JSON.stringify({ detail: "Local API proxy is unavailable" }))
  })

  request.pipe(proxyRequest)
}

function serveStandaloneGraph(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" })
    response.end()
    return
  }

  const graphStream = createReadStream(join(publicDirectory, "graph"))
  graphStream.on("open", () => {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    })
    if (request.method === "HEAD") {
      graphStream.destroy()
      response.end()
      return
    }
    graphStream.pipe(response)
  })
  graphStream.on("error", () => {
    if (!response.headersSent) response.writeHead(404)
    response.end()
  })
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${host}:${port}`).pathname
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    proxyApi(request, response)
    return
  }

  if (pathname === "/graph") {
    serveStandaloneGraph(request, response)
    return
  }

  void serveHandler(request, response, {
    public: publicDirectory,
    cleanUrls: true,
    headers: [
      {
        source: "**/*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ],
  })
})

server.listen(port, host, () => {
  console.log(`Quartz preview: http://${host}:${port}`)
  console.log(`API proxy: /api/* -> ${apiTarget.origin}/api/*`)
})
