import { redirect } from "next/navigation";

// Registration is disabled — this is a private single-user system.
export default function RegisterPage() {
  redirect("/login");
}
