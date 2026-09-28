import type { ChangeEvent } from "react";

export interface TextFieldProps {
  label: string;
  status?: "default" | "error" | "success";
  value?: string | number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  density?:
    | "compact"
    | "comfortable";
  // helperText?: string;  (commented out: must not become a fact)
}

export const TextField = ({ label, status = "default" }: TextFieldProps) => (
  <label className={`acme-field acme-field--${status}`}>{label}</label>
);
