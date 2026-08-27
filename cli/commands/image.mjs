// `design-ai image serve` starts the opt-in local Image Console gateway.

import { createImageConsoleServer } from "../lib/image-console-server.mjs";

function printHelp() {
  console.log("Usage: design-ai image serve [--host 127.0.0.1] [--port 4318]");
  console.log("\nStarts the local Image Console. Prompt Guide and provider credentials stay in this server process.");
}

export function parseImageArgs(args) {
  if (args.length === 0 || (args.length === 1 && ["--help", "-h"].includes(args[0])) || (args.length === 2 && args[0] === "serve" && ["--help", "-h"].includes(args[1]))) return { help: true };
  if (args[0] !== "serve") throw new Error("Usage: design-ai image serve [--host 127.0.0.1] [--port 4318]");
  const values = { host: "127.0.0.1", port: "4318" }; const seen = new Set();
  for (let index = 1; index < args.length; index += 2) {
    const flag = args[index]; const key = flag === "--host" ? "host" : flag === "--port" ? "port" : null;
    if (!key) throw new Error(`Unknown image serve option: ${flag}`);
    if (seen.has(flag)) throw new Error(`${flag} may be provided only once`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    seen.add(flag); values[key] = value;
  }
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("--port must be an integer between 1 and 65535");
  return { help: false, host: values.host, port };
}

export async function runImage(args) {
  const { help, host, port } = parseImageArgs(args);
  if (help) { printHelp(); return; }
  const gateway = createImageConsoleServer({ host, port });
  const address = await gateway.start();
  const actualHost = typeof address === "object" && address ? address.address : host;
  const actualPort = typeof address === "object" && address ? address.port : port;
  const displayHost = actualHost.includes(":") ? `[${actualHost}]` : actualHost;
  console.log(`Image Console listening at http://${displayHost}:${actualPort}`);
}
