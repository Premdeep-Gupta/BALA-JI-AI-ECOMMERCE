import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage = 120 }) => {
  const [jumpPage, setJumpPage] = useState("");

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage("");
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Calculations for showing products range info
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mt-12 p-6 glass border border-[hsla(var(--glass-border))] rounded-[2rem] shadow-xl w-full">
      {/* LEFT: RESULTS INFORMATION DISPLAY */}
      {totalItems > 0 ? (
        <div className="text-sm text-[var(--text)]/70 font-semibold tracking-wide">
          Showing <span className="text-white font-black">{startItem}</span> to{" "}
          <span className="text-white font-black">{endItem}</span> of{" "}
          <span className="text-[var(--primary)] font-black">{totalItems}</span> products
        </div>
      ) : (
        <div className="text-sm text-[var(--text)]/70 font-semibold tracking-wide">
          Page <span className="text-white font-black">{currentPage}</span> of{" "}
          <span className="text-[var(--primary)] font-black">{totalPages}</span>
        </div>
      )}

      {/* CENTER: CORE NAVIGATION CONTROLS */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* FIRST PAGE */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="First Page"
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/40 text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:bg-transparent disabled:hover:text-[var(--text)] transition-all duration-300 active:scale-95 shadow-md shadow-black/10"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* PREV PAGE */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous Page"
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/40 text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:bg-transparent disabled:hover:text-[var(--text)] transition-all duration-300 active:scale-95 shadow-md shadow-black/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* NUMBERS */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {getPageNumbers().map((page, idx) => {
            const isCurrent = page === currentPage;
            const isEllipsis = page === "...";

            return (
              <button
                key={`${page}_${idx}`}
                disabled={isEllipsis}
                onClick={() => typeof page === "number" && onPageChange(page)}
                className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 border flex items-center justify-center ${
                  isCurrent
                    ? "gradient-primary text-white border-[var(--primary)] shadow-[0_0_15px_rgba(220,100,60,0.4)] scale-105"
                    : isEllipsis
                    ? "border-transparent text-[var(--text)]/40 cursor-default bg-transparent font-medium"
                    : "border-[var(--border)] bg-[var(--card)]/40 text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-white active:scale-95 shadow-md"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* NEXT PAGE */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next Page"
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/40 text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:bg-transparent disabled:hover:text-[var(--text)] transition-all duration-300 active:scale-95 shadow-md shadow-black/10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* LAST PAGE */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last Page"
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/40 text-[var(--text)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:bg-transparent disabled:hover:text-[var(--text)] transition-all duration-300 active:scale-95 shadow-md shadow-black/10"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* RIGHT: ADVANCED JUMP INPUT PANEL */}
      <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
        <span className="text-xs text-[var(--text)]/60 font-semibold tracking-wider uppercase">Go to page:</span>
        <div className="relative flex items-center">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            placeholder={`${currentPage}/${totalPages}`}
            className="w-16 px-3 py-2 text-xs text-center text-white bg-[var(--card)]/50 border border-[var(--border)] rounded-xl outline-none focus:border-[var(--primary)] transition-all duration-300 font-bold placeholder-white/20 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
            className="absolute right-1 p-1 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white rounded-lg transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none active:scale-95"
            title="Go"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Pagination;
