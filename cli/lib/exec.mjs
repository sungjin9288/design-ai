// Shell execution helpers.

import { spawn, spawnSync } from "node:child_process";

/**
 * Run a command, streaming stdout/stderr.
 * Resolves with exit code, rejects on spawn error.
 */
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: opts.silent ? "pipe" : "inherit",
      cwd: opts.cwd,
      env: { ...process.env, ...(opts.env || {}) },
      shell: opts.shell || false,
    });

    let stdout = "";
    let stderr = "";

    if (opts.silent) {
      child.stdout?.on("data", (d) => (stdout += d));
      child.stderr?.on("data", (d) => (stderr += d));
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ code, stdout, stderr });
      else {
        const err = new Error(
          `Command "${cmd} ${args.join(" ")}" exited with code ${code}` +
            (stderr ? `\n${stderr}` : "")
        );
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
      }
    });
  });
}

/**
 * Run a command synchronously, returning stdout (silent on success).
 * Throws on non-zero exit.
 */
export function runSync(cmd, args = [], opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const err = new Error(
      `Command "${cmd} ${args.join(" ")}" exited with code ${result.status}`
    );
    err.code = result.status;
    err.stderr = result.stderr;
    throw err;
  }
  return result.stdout;
}
