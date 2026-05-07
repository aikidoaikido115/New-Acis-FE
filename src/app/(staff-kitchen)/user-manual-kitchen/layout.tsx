import { UtensilsCrossed } from "lucide-react";
import { ManualSidebar } from "@/components/features/user-manual/manual-sidebar";

const kitchenManualSections = [
  {
    id: "manage-meal",
    title: "จัดการมื้ออาหาร",
    icon: <UtensilsCrossed size={32} />,
  },
];

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <ManualSidebar
        basePath="/user-manual-kitchen"
        sections={kitchenManualSections}
        gridClassName="grid grid-cols-1 gap-4"
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
