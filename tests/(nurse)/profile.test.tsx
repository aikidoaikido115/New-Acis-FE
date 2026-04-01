import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { authService } from "@/services/auth.service";
import { getCroppedImg } from "@/lib/cropImage";
import { ProfilePageContent } from "@/components/features/profile/profile-page-content";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock toast
vi.mock("@/components/ui/toast", () => ({
  useToast: vi.fn(),
}));

// Mock authService
vi.mock("@/services/auth.service", () => ({
  authService: {
    fetchUserProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock getCroppedImg
vi.mock("@/lib/cropImage", () => ({
  getCroppedImg: vi.fn(),
}));

// Mock react-easy-crop
vi.mock("react-easy-crop", () => ({
  default: () => <div data-testid="cropper">Mock Cropper</div>,
}));

// Mock URL and localStorage
global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ProfilePageContent", () => {
  const mockRouterPush = vi.fn();
  const mockShowToast = vi.fn();

  const mockUser = {
    first_name: "สมหญิง",
    last_name: "ใจดี",
    nickname: "หญิง",
    phone: "0812345678",
    gender: "female",
    username: "somsri123",
    email: "somsri@example.com",
    role_name: "medical_staff",
    profile_image: "https://example.com/avatar.jpg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockRouterPush });
    (useToast as any).mockReturnValue({ showToast: mockShowToast });
    localStorageMock.clear();
  });

  it("Show loading spinner", () => {
    (authService.fetchUserProfile as any).mockImplementation(() => new Promise(() => {}));
    render(<ProfilePageContent />);
    expect(screen.getByText("กำลังโหลดข้อมูล...")).toBeInTheDocument();
  });

  it("Show user data after successful load", async () => {
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    render(<ProfilePageContent />);
    await waitFor(() => {
    expect(screen.getByDisplayValue("หญิง")).toBeInTheDocument();
    // TODO: เพิ่ม phone field ใน BE และแก้ไขการทดสอบที่เกี่ยวข้อง
    //expect(screen.getByDisplayValue("0812345678")).toBeInTheDocument();
      expect(screen.getByDisplayValue("somsri123")).toBeInTheDocument();
      expect(screen.getByText("somsri@example.com")).toBeInTheDocument();
      expect(screen.getByText("แพทย์/พยาบาล")).toBeInTheDocument();
    });
  });

  it("Fill form fields and save button becomes active", async () => {
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByDisplayValue("หญิง"));

    const nicknameInput = screen.getByDisplayValue("หญิง");
    fireEvent.change(nicknameInput, { target: { value: "ใหม่" } });
    expect(nicknameInput).toHaveValue("ใหม่");

    const saveButton = screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" });
    expect(saveButton).not.toBeDisabled();

    const cancelButton = screen.getByRole("button", { name: "ยกเลิก" });
    fireEvent.click(cancelButton);
    expect(screen.getByDisplayValue("หญิง")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it("Save updated profile information", async () => {
    const updatedUser = { ...mockUser, nickname: "ใหม่" };
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    (authService.updateProfile as any).mockResolvedValue(updatedUser);

    render(<ProfilePageContent />);
    await waitFor(() => screen.getByDisplayValue("หญิง"));

    const nicknameInput = screen.getByDisplayValue("หญิง");
    fireEvent.change(nicknameInput, { target: { value: "ใหม่" } });
    const saveButton = screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ nickname: "ใหม่" }));
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: "บันทึกสำเร็จ" }));
    });
    expect(screen.getByDisplayValue("ใหม่")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" })).toBeDisabled();
  });

  it("Cancel profile update", async () => {
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByDisplayValue("หญิง"));

    const nicknameInput = screen.getByDisplayValue("หญิง");
    fireEvent.change(nicknameInput, { target: { value: "ใหม่" } });
    expect(nicknameInput).toHaveValue("ใหม่");

    const cancelButton = screen.getByRole("button", { name: "ยกเลิก" });
    fireEvent.click(cancelButton);
    expect(screen.getByDisplayValue("หญิง")).toBeInTheDocument();
  });

  it("Click change password button and navigate to /change-password", async () => {
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByText("เปลี่ยนรหัสผ่าน"));
    fireEvent.click(screen.getByText("เปลี่ยนรหัสผ่าน"));
    expect(mockRouterPush).toHaveBeenCalledWith("/change-password");
  });

  it("Load profile image", async () => {
    const nurseUser = { ...mockUser, role_name: "medical_staff" };
    (authService.fetchUserProfile as any).mockResolvedValue(nurseUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByAltText("avatar"));
    const avatarImg = screen.getByAltText("avatar");
    expect(avatarImg).toHaveAttribute("src", "/images/nurse.png");
  });

  it("Show kitchen staff profile information", async () => {
    const kitchenUser = { ...mockUser, role_name: "kitchen_staff" };
    (authService.fetchUserProfile as any).mockResolvedValue(kitchenUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByText("เจ้าหน้าที่ครัว"));
    expect(screen.getByText("เจ้าหน้าที่ครัว")).toBeInTheDocument();
    expect(screen.getByText("โภชนา/ห้องครัว")).toBeInTheDocument();
    const avatarImg = screen.getByAltText("avatar");
    expect(avatarImg).toHaveAttribute("src", "/images/kitchen.png");
  });

//   TODO: แก้ไขการอัปโหลดที่ยังไม่สมบูรณ์
//   it("Upload profile image: Select image, crop, and upload successfully", async () => {
//     (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
//     const mockCroppedBlob = new Blob(["test"], { type: "image/jpeg" });
//     (getCroppedImg as any).mockResolvedValue(mockCroppedBlob);
//     const updatedUser = { ...mockUser, profile_image: "https://example.com/new.jpg" };
//     (authService.updateProfile as any).mockResolvedValue(updatedUser);

//     render(<ProfilePageContent />);
//     await waitFor(() => screen.getByText("สมหญิง ใจดี"));

//     const uploadButton = screen.getByRole("button", { name: /svg/i });
//     fireEvent.click(uploadButton);

//     const file = new File(["dummy"], "test.jpg", { type: "image/jpeg" });
//     const fileInput = screen.getByTestId("avatar-file-input");
//     fireEvent.change(fileInput, { target: { files: [file] } });

//     await waitFor(() => screen.getByText("ครอบรูปโปรไฟล์"));
//     const confirmButton = screen.getByText("ใช้รูปนี้");
//     fireEvent.click(confirmButton);

//     await waitFor(() => {
//       expect(authService.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ profile_image: expect.any(File) }));
//       expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ title: "สำเร็จ" }));
//     });
//   });

  it("Phone number accepts only numbers and is limited to 10 digits", async () => {
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByDisplayValue("0812345678"));
    const phoneInput = screen.getByDisplayValue("0812345678");
    fireEvent.change(phoneInput, { target: { value: "abc123" } });
    expect(phoneInput).toHaveValue("123");
    fireEvent.change(phoneInput, { target: { value: "12345678901" } });
    expect(phoneInput).toHaveValue("1234567890");
  });

  it("Email and position fields have lock icons and are read-only", async () => {
    (authService.fetchUserProfile as any).mockResolvedValue(mockUser);
    render(<ProfilePageContent />);
    await waitFor(() => screen.getByText("somsri@example.com"));
    // ตรวจสอบว่า email แสดงใน div (readonly)
    const emailDiv = screen.getByText("somsri@example.com");
    expect(emailDiv).toBeInTheDocument();

    const positionText = screen.getByText("แพทย์/พยาบาล");
    expect(positionText).toBeInTheDocument();

    // ตรวจสอบว่ามี lock icon 2 จุด (email, position)
    const lockIcons = screen.getAllByTestId("lock-icon");
    expect(lockIcons.length).toBe(2);
  });
});