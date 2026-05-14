// Shared helpers for side-effect-free command help paths.

export function hasHelpFlag(args = []) {
  return args.some((arg) => arg === "-h" || arg === "--help");
}
