import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminTabsNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: any) => void;
}

export function AdminTabsNav({ tabs, activeTab, onChange }: AdminTabsNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag-to-scroll state
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const onResize = () => updateScrollState();
    window.addEventListener('resize', onResize);

    // Auto-scroll active tab into view smoothly
    const activeBtn = el.querySelector(`[data-tab-key="${activeTab}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }

    return () => window.removeEventListener('resize', onResize);
  }, [activeTab, updateScrollState]);

  // Non-passive wheel listener on desktop so mouse wheel translates directly into horizontal scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
        updateScrollState();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [updateScrollState]);

  const scrollBy = (amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(updateScrollState, 220);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsMouseDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollStart(el.scrollLeft);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.3;
    if (Math.abs(walk) > 4) {
      setIsDragging(true);
    }
    scrollRef.current.scrollLeft = scrollStart - walk;
    updateScrollState();
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setTimeout(() => setIsDragging(false), 50);
  };

  return (
    <div className="relative flex items-center group/tabnav w-full">
      {/* Desktop Left Scroll Button */}
      <button
        type="button"
        onClick={() => scrollBy(-240)}
        disabled={!canScrollLeft}
        title="Scroll tabs left"
        className={`hidden md:flex absolute -left-2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 transition-all ${
          canScrollLeft
            ? 'opacity-100 scale-100 cursor-pointer hover:scale-105'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Left Fade Shadow */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10" />
      )}

      {/* Tabs Container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex items-center gap-2 overflow-x-auto pb-1.5 admin-scrollbar w-full scroll-smooth px-1 select-none ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-tab-key={key}
            onClick={() => {
              if (!isDragging) {
                onChange(key);
              }
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === key
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-brand-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Right Fade Shadow */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10" />
      )}

      {/* Desktop Right Scroll Button */}
      <button
        type="button"
        onClick={() => scrollBy(240)}
        disabled={!canScrollRight}
        title="Scroll tabs right"
        className={`hidden md:flex absolute -right-2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-800 transition-all ${
          canScrollRight
            ? 'opacity-100 scale-100 cursor-pointer hover:scale-105'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
