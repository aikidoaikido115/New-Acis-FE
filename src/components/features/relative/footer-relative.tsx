// src/components/shared/app-footer.tsx
import Link from "next/link";

export function AppFooterRelative() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer w-full bg-slate-50 border-t border-slate-200 py-6 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-slate-500">
          
          {/* ส่วน Copyright */}
          <div>
            © {currentYear} Elder Nursing. All rights reserved.
          </div>

          <span className="hidden md:inline text-slate-300">|</span>

          {/* ส่วน Links (Term / Privacy) */}
          <div className="flex items-center gap-2">
            <Link href="/relative/terms" className="hover:text-[#0093EF] hover:underline transition-colors">
              ข้อกำหนดการใช้งาน
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/relative/privacy" className="hover:text-[#0093EF] hover:underline transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
          </div>
          
        </div>
      </div>
    </footer>
  );
}