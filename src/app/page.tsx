import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  const role = cookieStore.get("user_role")?.value?.toLowerCase();

  if (token?.value) {
    if (role === "kitchen") {
      redirect("/manage-meal");
    }
    if (role === "relative") {
      redirect("/relative/dashboard");
    }
    if (role === "admin") {
      redirect("/admin/users");
    }
    if (role === "superuser" || role === "super user" || role === "super_user") {
      redirect("/dashboard");
    }
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
