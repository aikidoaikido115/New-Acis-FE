import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/shared/app-sidebar";

// Mock usePathname from next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue('/dashboard');
  });

  // Helper to render with props
  const renderSidebar = (props = {}) => {
    return render(<AppSidebar {...props} />);
  };

  describe('menu items for nurse role', () => {
    it('should display correct main menu items', () => {
      renderSidebar({ role: 'nurse' });
      const expectedMain = [
        'แดชบอร์ด',
        'แฟ้มข้อมูลผู้สูงอายุ',
        'เวชระเบียน',
        'จัดการยา',
        'ตารางกิจกรรม',
        'สินค้าคงคลัง',
      ];
      for (const label of expectedMain) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      // Check support items
      expect(screen.getByText('คู่มือการใช้งาน')).toBeInTheDocument();
      expect(screen.getByText('แจ้งปัญหาการใช้งาน')).toBeInTheDocument();
    });

    it('should have correct href for each menu item', () => {
      renderSidebar({ role: 'nurse' });
      const links = [
        { label: 'แดชบอร์ด', href: '/dashboard' },
        { label: 'แฟ้มข้อมูลผู้สูงอายุ', href: '/elder-info' },
        { label: 'เวชระเบียน', href: '/emr' },
        { label: 'จัดการยา', href: '/medicine' },
        { label: 'ตารางกิจกรรม', href: '/activity' },
        { label: 'สินค้าคงคลัง', href: '/warehouse' },
        { label: 'คู่มือการใช้งาน', href: '/user-manual' },
        { label: 'แจ้งปัญหาการใช้งาน', href: '/support-service' },
      ];
      for (const { label, href } of links) {
        const link = screen.getByText(label).closest('a');
        expect(link).toHaveAttribute('href', href);
      }
    });
  });

  describe('menu items for kitchen role', () => {
    it('should display correct main menu items', () => {
      renderSidebar({ role: 'kitchen' });
      expect(screen.getByText('จัดการมื้ออาหาร')).toBeInTheDocument();
      expect(screen.getByText('คู่มือการใช้งาน')).toBeInTheDocument();
      expect(screen.getByText('แจ้งปัญหาการใช้งาน')).toBeInTheDocument();
    });

    it('should have correct href for menu items', () => {
      renderSidebar({ role: 'kitchen' });
      const links = [
        { label: 'จัดการมื้ออาหาร', href: '/manage-meal' },
        { label: 'คู่มือการใช้งาน', href: '/user-manual-kitchen' },
        { label: 'แจ้งปัญหาการใช้งาน', href: '/support-service-kitchen' },
      ];
      for (const { label, href } of links) {
        const link = screen.getByText(label).closest('a');
        expect(link).toHaveAttribute('href', href);
      }
    });
  });

  describe('collapsible functionality', () => {
    it('should call onCollapsedChange when collapse button is clicked', () => {
      const onCollapsedChange = vi.fn();
      renderSidebar({ role: 'nurse', onCollapsedChange });
      // Collapse button is only visible on large screens (lg:flex). In tests it's visible because no media query.
      const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
      fireEvent.click(collapseButton);
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });

    it('should have collapsed width when isCollapsed is true', () => {
    renderSidebar({ role: 'nurse', isCollapsed: true });
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-16');

    expect(screen.queryByText('แดชบอร์ด')).not.toBeInTheDocument();

    const dashboardLink = screen.getByRole('link', { name: /แดชบอร์ด/i }); 
    const linkWithTitle = screen.getByTitle('แดชบอร์ด');
    expect(linkWithTitle).toBeInTheDocument();
    });

    it('should have expanded width when isCollapsed is false', () => {
      renderSidebar({ role: 'nurse', isCollapsed: false });
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('w-72');
    });
  });

  describe('responsive behavior (mobile)', () => {
    it('should show overlay button when isOpen is true and onClose is provided', () => {
      const onClose = vi.fn();
      renderSidebar({ role: 'nurse', isOpen: true, onClose });
      const overlayButton = screen.getByRole('button', { name: /close sidebar/i });
      expect(overlayButton).toBeInTheDocument();
      fireEvent.click(overlayButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('should not show overlay button when onClose is not provided', () => {
      renderSidebar({ role: 'nurse', isOpen: true });
      const overlayButton = screen.queryByRole('button', { name: /close sidebar/i });
      expect(overlayButton).not.toBeInTheDocument();
    });

    it('should apply -translate-x-full when isOpen is false', () => {
      renderSidebar({ role: 'nurse', isOpen: false });
      const aside = screen.getByRole('complementary');
      expect(aside).toHaveClass('-translate-x-full');
    });
  });

  describe('active menu item highlighting', () => {
    it('should highlight the active menu item based on current path', () => {
      (usePathname as any).mockReturnValue('/dashboard');
      renderSidebar({ role: 'nurse' });
      const dashboardLink = screen.getByText('แดชบอร์ด').closest('a');
      expect(dashboardLink).toHaveClass('bg-white/20');
      // Check another item not active
      const elderLink = screen.getByText('แฟ้มข้อมูลผู้สูงอายุ').closest('a');
      expect(elderLink).toHaveClass('text-white/90 hover:bg-white/10');
    });
  });
});