import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AdminTableScrollProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
  tableTitle?: string;
}

export function AdminTableScroll({
  children,
  className = '',
  minWidth = '850px',
  tableTitle,
}: AdminTableScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse drag-to-scroll state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && scrollLeft < maxScroll - 2);
    setScrollProgress(maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updateScrollState]);

  const scrollBy = (amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 200);
  };

  const scrollToEdge = (edge: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: edge === 'left' ? 0 : scrollRef.current.scrollWidth,
      behavior: 'smooth',
    });
    setTimeout(updateScrollState, 200);
  };

  // Mouse drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging when clicking buttons, inputs, selects, links
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, label, [role="button"]')) {
      return;
    }
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    setIsMouseDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollStart(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.3;
    scrollRef.current.scrollLeft = scrollStart - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    setIsMouseDown(false);
  };

  const isOverflowing = canScrollLeft || canScrollRight;

  return (
    <div className={`relative group/tablescroll ${className}`}>
      {/* Top Desktop Quick-Scroll Toolbar */}
      {isOverflowing && (
        <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {tableTitle ? `${tableTitle} columns` : 'Table view'}:
            </span>
            <span className="text-[10px] text-slate-400">
              Hold Shift + wheel, click arrows, or drag to pan columns
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Scroll progress mini bar */}
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mr-1">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-150"
                style={{ width: `${Math.max(15, scrollProgress)}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => scrollToEdge('left')}
              disabled={!canScrollLeft}
              title="Jump to first column"
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronsLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(-250)}
              disabled={!canScrollLeft}
              title="Scroll left"
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(250)}
              disabled={!canScrollRight}
              title="Scroll right"
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => scrollToEdge('right')}
              disabled={!canScrollRight}
              title="Jump to last column (Actions)"
              className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronsRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Left Button on Hover */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-260)}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-lg items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 transition transform hover:scale-110"
          title="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Floating Right Button on Hover */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(260)}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-lg items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 transition transform hover:scale-110"
          title="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Left Edge Shadow Indicator */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/10 dark:from-black/30 to-transparent z-10" />
      )}

      {/* Right Edge Shadow Indicator */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black/10 dark:from-black/30 to-transparent z-10" />
      )}

      {/* Table Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`overflow-x-auto admin-scrollbar pb-1 select-auto ${
          isMouseDown ? 'cursor-grabbing select-none' : 'cursor-default'
        }`}
      >
        <div style={{ minWidth }} className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
