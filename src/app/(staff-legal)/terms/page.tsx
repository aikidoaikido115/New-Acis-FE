import { TERMS_CONTENT } from "@/constants/legal/terms-data";

export default function TermsOfServicePage() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12">
      {/* Content Card */}
      <div className="bg-white rounded-2xl shadow-md p-8 md:p-12">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {TERMS_CONTENT.title}
          </h1>
          <p className="text-sm text-gray-500">
            แก้ไขล่าสุดเมื่อ: {TERMS_CONTENT.latest_update}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {TERMS_CONTENT.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {section.title}
              </h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-4">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
