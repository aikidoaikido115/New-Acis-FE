import Image from "next/image";

export function AppLogoRelative() {
  return (
    <div className="flex items-center justify-center mb-4">
      {/* Logo */}
      <div className="relative w-16 h-16 shrink-0">
        <Image
          src="/logo.png"
          alt="Elder Nursing Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      
      {/* Title and Tagline */}
      <div className="ml-3 flex flex-col">
        <h1 className="text-3xl font-bold text-white leading-tight drop-shadow-md">Elder Nursing</h1>
        <p className="text-white text-sm opacity-90 drop-shadow-md">
          ระบบสำหรับติดตามอาการ
        </p>
      </div>
    </div>
  );
}
