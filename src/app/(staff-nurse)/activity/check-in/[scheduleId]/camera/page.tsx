"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Camera, Hand, SkipForward } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  loadCheckInSession,
  saveCheckInSession,
  type CheckInSession,
} from "@/components/features/activity/check-in/checkin-storage";

const formatName = (session: CheckInSession | null, residentId?: string | null) => {
  if (!session || !residentId) return "-";
  return session.residents.find((resident) => resident.id === residentId)?.name || "-";
};

export default function ActivityCheckInCameraPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const scheduleId = String(params?.scheduleId || "");

  const [session, setSession] = useState<CheckInSession | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = loadCheckInSession(scheduleId);
    if (!stored) {
      setSession(null);
      return;
    }

    const rejectedSet = new Set(stored.rejectedIds || []);
    
    const pendingIds = stored.selectedIds.filter(
      (id) => !stored.photos[id] && !rejectedSet.has(id)
    );

    const retakeId = searchParams.get("retake");
    const orderedQueue = retakeId && pendingIds.includes(retakeId)
      ? [retakeId, ...pendingIds.filter((id) => id !== retakeId)]
      : pendingIds;

    if (orderedQueue.length === 0) {
      router.push(`/activity/check-in/${scheduleId}/review?${searchParams.toString()}`);
      return;
    }

    setSession(stored);
    setPhotos(stored.photos || {});
    setRejectedIds(rejectedSet);
    setQueue(orderedQueue);
  }, [scheduleId, searchParams, router]);

  useEffect(() => {
    if (!navigator?.mediaDevices?.getUserMedia) return;

    let isActive = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!isActive) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsStreamReady(true);
        }
      } catch {
        setIsStreamReady(false);
      }
    };

    startCamera();

    return () => {
      isActive = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const nextSession = {
      ...session,
      photos,
      rejectedIds: Array.from(rejectedIds),
      updatedAt: new Date().toISOString(),
    };
    saveCheckInSession(nextSession);
    setSession(nextSession);
  }, [photos, rejectedIds]);

  useEffect(() => {
    if (session && queue.length === 0) {
      router.push(`/activity/check-in/${scheduleId}/review?${searchParams.toString()}`);
    }
  }, [queue, session, router, scheduleId, searchParams]);

  const currentId = queue[0] || null;
  const total = session?.selectedIds.length || 0;
  
  const completed = Object.keys(photos).length + rejectedIds.size;
  const currentIndex = Math.min(completed + 1, total || 1);
  const nextId = queue.length > 1 ? queue[1] : null;

  const handleCapture = () => {
    if (!videoRef.current || !currentId) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotos((prev) => ({ ...prev, [currentId]: dataUrl }));
    setQueue((prev) => prev.slice(1));
  };

  const handleSkip = () => {
    if (queue.length === 0) return;
    if (queue.length === 1) {
      showToast({
        type: "info",
        title: "ไม่สามารถข้ามได้",
        message: "เหลือผู้เข้าร่วมเพียงท่านเดียว กรุณาถ่ายรูปหรือปฏิเสธ",
      });
      return;
    }
    // ข้าม: ย้ายคนปัจจุบันไปท้ายคิว
    setQueue((prev) => [...prev.slice(1), prev[0]]);
  };

  const handleReject = () => {
    if (!currentId) return;
    setRejectedIds((prev) => new Set(prev).add(currentId));
    setQueue((prev) => prev.slice(1));
    setIsRejectModalOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !currentId) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      setPhotos((prev) => ({ ...prev, [currentId]: result }));
      setQueue((prev) => prev.slice(1));
      input.value = "";
    };
    reader.readAsDataURL(file);
  };

  const currentName = formatName(session, currentId);
  const nextName = formatName(session, nextId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col ">
      {/* Header */}
      <div className="bg-white px-4 py-3 text-slate-700 ">
        <div className="grid grid-cols-3 items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0093EF] hover:text-[#0082D4] justify-self-start"
          >
            <ChevronLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
          <div className="flex items-center gap-1 text-sm font-semibold justify-self-center whitespace-nowrap">
            <Camera className="h-4 w-4" />
            <span>ถ่ายภาพ: {currentIndex}/{total} {currentName}</span>
          </div>
          <div />
        </div>
      </div>

      {!session && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
          ไม่พบข้อมูลการเช็คชื่อ
        </div>
      )}

      {session && (
        <>
          <div className=" bg-black flex items-center justify-center flex-1 min-h-0 max-h-[65vh]">
            <video
              ref={videoRef}
              className="w-full max-h-[60vh] object-contain"
              playsInline
              muted
            />
          </div>

          {/* ส่วนปุ่มและข้อความถัดไป */}
          <div className="bg-white px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <Hand className="h-4 w-4" />
                  <span className="hidden sm:inline">ไม่สะดวก / </span>
                  <span>ปฏิเสธ</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="justify-center inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white"
                  title="อัปโหลดรูปภาพจากไฟล์"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>อัปโหลดรูปภาพ</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleCapture}
                disabled={!isStreamReady}
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border-4 ${
                  isStreamReady ? "border-[#0093EF] text-[#0093EF]" : "border-slate-300 text-slate-300"
                }`}
              >
                <Camera className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-white"
              >
                <SkipForward className="h-4 w-4" />
                <span className="hidden sm:inline">ข้ามไปก่อน</span>
                <span className="inline sm:hidden">ข้าม</span>
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-slate-600">
              ถัดไป: {nextName || "-"}
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="ยืนยันการปฏิเสธการถ่ายภาพ"
        size="md"
      >
        <p className="text-sm text-slate-700">คุณต้องการปฏิเสธการถ่ายภาพสำหรับ {currentName} ใช่หรือไม่?</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsRejectModalOpen(false)}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
          >
            ยืนยันการปฏิเสธ
          </button>
        </div>
      </Modal>
    </div>
  );
}