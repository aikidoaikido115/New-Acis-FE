import { redirect } from "next/navigation";

export default function ManualIndexPage() {
  // Redirect to the first manual section
  redirect("/manual/dashboard");
}
