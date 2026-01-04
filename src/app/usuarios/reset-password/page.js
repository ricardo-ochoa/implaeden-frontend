import { Suspense } from "react";
import ResetPasswordAdminClient from "./ResetPasswordAdminClient";

export default function ResetPasswordAdminPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordAdminClient />
    </Suspense>
  );
}
