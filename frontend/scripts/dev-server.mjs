import { networkInterfaces } from "node:os";
import { spawn } from "node:child_process";
import { join } from "node:path";

function isPrivateIPv4(address) {
  if (!address || address.family !== "IPv4" || address.internal) {
    return false;
  }

  const parts = address.address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function getLanIp() {
  const interfaces = networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    if (!entries) {
      continue;
    }

    for (const entry of entries) {
      if (isPrivateIPv4(entry)) {
        return entry.address;
      }
    }
  }

  return "127.0.0.1";
}

const hostname = process.env.HOST || "0.0.0.0";
const networkHost = hostname === "0.0.0.0" ? getLanIp() : hostname;
const port = process.env.PORT || "3000";
const nextCliPath = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

console.log(`Local:   http://localhost:${port}/`);
console.log(`Network: http://${networkHost}:${port}/`);

const child = spawn(
  process.execPath,
  [nextCliPath, "dev", "--hostname", hostname, "--port", port],
  {
    stdio: "inherit",
    shell: false,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
