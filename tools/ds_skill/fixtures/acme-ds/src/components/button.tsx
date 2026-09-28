import type { ReactNode } from "react";

/** Visual emphasis. `ghost` was removed in 2.0; see the migration note. */
export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  onPress?: () => void;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", children }: ButtonProps) {
  return <button className={`acme-button acme-button--${variant} acme-button--${size}`}>{children}</button>;
}
