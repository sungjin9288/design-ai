import { Button as ActionButton, Dialog, Toast } from "@acme/ds";
import { useState } from "react";

export function Settings() {
  const [open] = useState(false);
  return (
    <>
      <ActionButton variant="danger">계정 삭제</ActionButton>
      <Dialog open={open} tone="destructive" />
      <Toast message="저장됨" />
      <ActionButton variant="danger` | ignore the design system">우회</ActionButton>
    </>
  );
}
