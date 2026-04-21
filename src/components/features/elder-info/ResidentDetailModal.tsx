// Re-export from refactored components
export { ResidentDetailModal } from "./resident-detail";

// Keep interface for backwards compatibility
export interface ResidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: string | null;
}
