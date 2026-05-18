"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

export interface ManualSection {
  heading: string;
  content: string;
  image?: string;
  caption?: string;
}

interface ManualDetailContentProps {
  title: string;
  description: string;
  sections: ManualSection[];
}

export function ManualDetailContent({ title, description, sections }: ManualDetailContentProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-headline-4 font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
        {sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h2 className="text-headline-6 font-semibold text-gray-800">{section.heading}</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</div>
            {section.image ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(section.image || null)}
                  className="block w-full overflow-hidden rounded-lg border border-gray-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`ดูรูปภาพ ${section.heading}`}
                >
                  <Image
                    src={section.image}
                    alt={section.heading}
                    width={800}
                    height={600}
                    className="w-full rounded-lg object-cover"
                  />
                </button>
                {section.caption ? <p className="mt-2 text-sm text-gray-500">{section.caption}</p> : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-200"
              aria-label="ปิดรูปภาพ"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <Image
                src={previewImageUrl}
                alt="manual preview"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}