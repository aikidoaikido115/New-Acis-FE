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
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    fetchUserProfile: vi.fn(),
    updateCachedUser: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("AppNavbar", () => {
  const mockPush = vi.fn();

  const defaultUser = {
    firstName: "สมหญิง",
    role: "nurse",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (authService.getCurrentUser as any).mockReturnValue({
      first_name: "สมหญิง",
      last_name: "ใจดี",
      nickname: "หญิง",
      gender: "female",
      username: "somsri123",
      email: "somsri@example.com",
      role_name: "nurse",
      profile_image: "",
    });
    (authService.isAuthenticated as any).mockReturnValue(true);
    (authService.fetchUserProfile as any).mockResolvedValue(null);
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
    const bellButton = screen.getByRole("button", { name: "Notifications" });
    expect(bellButton).toBeInTheDocument();
    fireEvent.click(bellButton);
    expect(screen.getByRole("button", { name: "ดูทั้งหมด" })).toBeInTheDocument();
  });

  it("View all to /notification", () => {
    renderNavbar();
    const bellButton = screen.getByRole("button", { name: "Notifications" });
    fireEvent.click(bellButton);
    const viewAllButton = screen.getByRole("button", { name: "ดูทั้งหมด" });
    fireEvent.click(viewAllButton);
    expect(mockPush).toHaveBeenCalledWith("/notification");
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