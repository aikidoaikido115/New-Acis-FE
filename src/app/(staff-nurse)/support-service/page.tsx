"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Support form submitted:", formData);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
    alert("ส่งรายงานเรียบร้อยแล้ว เราจะติดต่อกลับโดยเร็วที่สุด");
  };

  const handleClear = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">แจ้งปัญหาการใช้งาน</h1>
        <p className="text-sm text-gray-600">กรอกข้อมูลด้านล่างเพื่อแจ้งปัญหาที่พบ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ชื่อผู้แจ้ง<span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="กรอกชื่อ - นามสกุล"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  อีเมล<span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="example@email.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                หัวข้อเรื่อง<span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="สรุปปัญหาที่พบ"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="h-11 border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                เนื้อหา<span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="อธิบายรายละเอียดของปัญหาที่พบ..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="min-h-[150px] border-gray-300 bg-[rgba(245,245,245,1)] placeholder:text-[#8C929D] resize-none"
                rows={6}
                required
              />
              <p className="text-xs text-gray-500">กรุณาอธิบายปัญหาอย่างละเอียด เพื่อให้ทีมงานสามารถช่วยเหลือได้อย่างรวดเร็ว</p>
            </div>

            <div className="border-t border-gray-200 pt-6"></div>

            <div className="flex justify-between items-center">
              <Button
                type="button"
                onClick={handleClear}
                className="border border-gray-300 text-gray-700 hover:bg-gray-100 px-6 h-10 text-sm"
              >
                ล้างข้อมูล
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 px-8 h-11"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">เวลาตอบกลับ</h3>
            <p className="text-sm text-blue-700 leading-relaxed">ทีมงานจะตอบกลับภายใน 24 ชั่วโมง</p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-green-800 mb-2">ติดต่อด่วน</h3>
            <p className="text-sm text-green-700 leading-relaxed">โทร: 02-xxx-xxxx</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">อีเมล</h3>
            <p className="text-sm text-yellow-700 leading-relaxed break-all">support.eldernursing.gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
