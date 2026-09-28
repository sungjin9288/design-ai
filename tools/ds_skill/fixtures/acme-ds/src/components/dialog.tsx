export { Badge } from "./badge";

export interface DialogProps {
  open: boolean;
  tone?: "neutral" | "destructive";
}

export function Dialog({ open, tone = "neutral" }: DialogProps) {
  return open ? <div role="dialog" data-tone={tone}><p>Don't close this yet</p></div> : null;
}
// export function LegacyModal() {}

const usageDoc = `export const Phantom = 1;`;

export function DialogTitle({ children }: { children: string }) {
  return <h2>{children}</h2>;
}

export const dialogDefaults = { tone: "neutral", doc: usageDoc };
