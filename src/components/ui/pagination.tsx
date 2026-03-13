import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const handleFirst = () => onPageChange(1);
  const handleLast = () => onPageChange(totalPages);
  const handlePrevious = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));

  // Generate page numbers to display (show 5 pages max)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page and 2 pages on each side
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      // Adjust if near the start
      if (currentPage <= 3) {
        end = maxVisible;
      }
      
      // Adjust if near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-end gap-2 mt-6">
      {/* Navigation Buttons Group - Left Side */}
      <div className="flex">
        {/* First Page Button */}
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 text-blue-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors rounded-l-md border-r-0"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 text-blue-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors rounded-r-md"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Page Numbers Group */}
      <div className="flex">
        {pageNumbers.map((page, index) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center border border-gray-300 text-sm font-medium transition-colors ${
              index === 0 ? "rounded-l-md" : ""
            } ${
              index === pageNumbers.length - 1 ? "rounded-r-md" : ""
            } ${
              index !== 0 ? "border-l-0" : ""
            } ${
              currentPage === page
                ? "bg-blue-500 text-white border-blue-500 z-10"
                : "text-blue-500 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Navigation Buttons Group - Right Side */}
      <div className="flex">
        {/* Next Page Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 text-blue-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors rounded-l-md border-r-0"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center border border-gray-300 text-blue-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors rounded-r-md"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
