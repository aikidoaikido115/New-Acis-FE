export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        {/* Container หลักที่คุมความกว้าง */}
        <div className="w-full max-w-[1000px] flex flex-col gap-1">
          {children}
        </div>
      </div>
    );
  }