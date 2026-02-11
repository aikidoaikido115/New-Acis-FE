'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, User } from 'lucide-react';

interface RelativeSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function RelativeSidebar({ isOpen = true, onClose }: RelativeSidebarProps) {
  // TODO: ดึงข้อมูลจริงจาก API
  const elderInfo = {
    name: 'สมชาย ศรีบุญเมือง',
    gender: 'ชาย',
    age: 65,
    status: 'พักอยู่ในศูนย์',
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-linear-to-b from-[#1E88E5] to-[#42A5F5] z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-80 flex flex-col`}
      >
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white lg:hidden hover:bg-white/10 rounded-full p-2"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Header - Logo */}
        <Link href="/relative/dashboard" className="block">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0 p-1">
              <Image
                src="/images/logo.png"
                alt="Elder Nursing Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Elder Nursing
              </h1>
              <p className="text-white/90 text-xs">
                ระบบสำหรับติดตามอาการ
              </p>
            </div>
          </div>
        </div>
        </Link>

        {/* Elder Info Section */}
        <div className="flex-1 px-6 py-8 flex flex-col items-center">
          {/* Profile Avatar - Mock */}
          <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 mb-6 overflow-hidden ring-4 ring-white/30 flex items-center justify-center">
            <User size={80} className="text-white" />
          </div>

          {/* Name */}
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {elderInfo.name}
          </h2>

          {/* Gender & Age */}
          <p className="text-white/90 text-sm mb-8">
            เพศ {elderInfo.gender} | อายุ {elderInfo.age} ปี
          </p>

          {/* Link to Profile */}
          <Link
            href="/relative/patient-info"
            className="text-white underline text-sm mb-6 hover:text-white/80 transition-colors"
          >
            ประวัติผู้สูงอายุ
          </Link>

          {/* Status Button */}
          <button className="bg-[#D4FDE7] text-green-700 font-light px-2 py-1 rounded-full transition-colors shadow-lg text-xs">
            {elderInfo.status}
          </button>
        </div>
      </aside>
    </>
  );
}
