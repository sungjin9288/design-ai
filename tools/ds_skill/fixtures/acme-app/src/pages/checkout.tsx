import { Button, TextField } from "@acme/ds";

export function Checkout() {
  return (
    <form>
      <TextField label="카드 번호" status="error" />
      <Button variant="primary" size="lg">결제하기</Button>
      <Button variant="ghost">취소</Button>
    </form>
  );
}
