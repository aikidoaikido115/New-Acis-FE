import { ManualSidebar } from "@/components/features/user-manual/manual-sidebar";

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <ManualSidebar basePath="/user-manual" />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
