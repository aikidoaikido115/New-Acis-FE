"use client";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface ElderTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
}

export function ElderTablePagination({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
}: ElderTablePaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPagesToShow; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-600 border-t border-slate-200">
      {/* Left side: Data summary */}
      <div className="text-sm">
        แสดง {startItem.toLocaleString()} ถึง {endItem.toLocaleString()} จากทั้งหมด {totalItems.toLocaleString()} รายการ
      </div>

      {/* Right side: Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          aria-label="หน้าแรก"
        >
          <ChevronsLeft className="w-3 h-3" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded border border-slate-200 px-2 py-1 transition ${
              page === currentPage
                ? "bg-[#0093EF] text-white border-[#0093EF]"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded border border-slate-200 px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          aria-label="หน้าสุดท้าย"
        >
          <ChevronsRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}