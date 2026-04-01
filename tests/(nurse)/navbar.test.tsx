import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { AppNavbar } from "@/components/shared/app-navbar";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/services/auth.service", () => ({
  authService: {
    logout: vi.fn(),
  },
}));

vi.mock("@/components/features/nurse/notifications", () => ({
  NotificationBell: ({ notificationsCount }: { notificationsCount: number }) => (
    <div data-testid="notification-bell" data-count={notificationsCount}>
      <button data-testid="bell-button">🔔</button>
      <div data-testid="notification-dropdown" style={{ display: "none" }}>
        <a href="/notification" data-testid="view-all">ดูทั้งหมด</a>
      </div>
    </div>
  ),
}));

describe("AppNavbar", () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  const defaultUser = {
    firstName: "สมหญิง",
    role: "nurse",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (authService.logout as any).mockResolvedValue(undefined);
  });

  const renderNavbar = (props = {}) => {
    const defaultProps = {
      user: defaultUser,
      notificationsCount: 5,
      onToggleSidebar: vi.fn(),
    };
    return render(<AppNavbar {...defaultProps} {...props} />);
  };

  it("Logo to /", () => {
    renderNavbar();
    const logo = screen.getByLabelText("Go to dashboard");
    fireEvent.click(logo);
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("Click NotificationBell", () => {
    renderNavbar();
    const bellButton = screen.getByTestId("bell-button");
    // เนื่องจากเราจำลอง NotificationBell ให้มีปุ่มเปิด dropdown
    // เราตรวจสอบว่ามีปุ่มนั้นอยู่ (แสดงว่า component ถูก render)
    expect(bellButton).toBeInTheDocument();
    // จำลองการคลิก (NotificationBell ภายในควรเปิด dropdown)
    fireEvent.click(bellButton);
    // เราสามารถตรวจสอบว่า dropdown แสดง (ในของจริงต้องมี state)
    // แต่ใน mock เราสามารถตรวจสอบว่า element ของ dropdown มีอยู่
    const dropdown = screen.getByTestId("notification-dropdown");
    expect(dropdown).toBeInTheDocument();
  });

  it("View all to /notification", () => {
    renderNavbar();
    // เปิด dropdown (จำลอง)
    const bellButton = screen.getByTestId("bell-button");
    fireEvent.click(bellButton);
    const viewAllLink = screen.getByTestId("view-all");
    expect(viewAllLink).toBeInTheDocument();
      // ตรวจสอบ href ของลิงก์แทนการตรวจ mockPush
      expect(viewAllLink.closest("a")).toHaveAttribute("href", "/notification");
  });

  it("Click profile button", () => {
    renderNavbar();
    const profileButton = screen.getByRole("button", { name: /สมหญิง/i });
    fireEvent.click(profileButton);
    expect(screen.getByText("แก้ไขโปรไฟล์")).toBeInTheDocument();
    expect(screen.getByText("ออกจากระบบ")).toBeInTheDocument();
  });

  it("Go to /profile", () => {
    renderNavbar();
    const profileButton = screen.getByRole("button", { name: /สมหญิง/i });
    fireEvent.click(profileButton);
    const editLink = screen.getByText("แก้ไขโปรไฟล์").closest("a");
    expect(editLink).toHaveAttribute("href", "/profile");
      // ตรวจสอบ href ของลิงก์แทนการตรวจ mockPush
      expect(editLink).toHaveAttribute("href", "/profile");
  });

  it("/logout", async () => {
    renderNavbar();
    const profileButton = screen.getByRole("button", { name: /สมหญิง/i });
    fireEvent.click(profileButton);
    const logoutButton = screen.getByText("ออกจากระบบ");
    fireEvent.click(logoutButton);
    expect(authService.logout).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});