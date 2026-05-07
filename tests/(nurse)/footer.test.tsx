import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppFooter } from "@/components/shared/app-footer";

describe("AppFooter", () => {
  it("Display check", () => {
    render(<AppFooter />);
    expect(screen.getByText("ข้อกำหนดการใช้งาน")).toBeInTheDocument();
    expect(screen.getByText("นโยบายความเป็นส่วนตัว")).toBeInTheDocument();
  });

  it("href check", () => {
    render(<AppFooter />);
    expect(screen.getByText("ข้อกำหนดการใช้งาน").closest("a")).toHaveAttribute("href", "/terms");
    expect(screen.getByText("นโยบายความเป็นส่วนตัว").closest("a")).toHaveAttribute("href", "/privacy");
  });

  it("hover class check", () => {
    render(<AppFooter />);
    const terms = screen.getByText("ข้อกำหนดการใช้งาน");
    const privacy = screen.getByText("นโยบายความเป็นส่วนตัว");
    expect(terms).toHaveClass("hover:text-[#0093EF]");
    expect(privacy).toHaveClass("hover:text-[#0093EF]");
    expect(terms).toHaveClass("hover:underline");
    expect(privacy).toHaveClass("hover:underline");
  });
});