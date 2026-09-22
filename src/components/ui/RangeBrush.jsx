import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Two-handle brush over an integer axis (month indices in the area chart).
 * Drag either handle, or tap the track to move the nearer one. Handles have
 * a 44px hit area and keyboard support (arrow keys, Home/End).
 */
const RangeBrush = ({ min = 0, max, start, end, onChange, ticks = [], className = '' }) => {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'start' | 'end' | null
  const span = Math.max(1, max - min);
  const pct = (v) => ((v - min) / span) * 100;

  const valueAt = useCallback((clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(min + ratio * span);
  }, [min, span]);

  const move = useCallback((handle, v) => {
    if (handle === 'start') onChange({ start: Math.min(Math.max(min, v), end - 1), end });
    else onChange({ start, end: Math.max(Math.min(max, v), start + 1) });
  }, [min, max, start, end, onChange]);

  // Window-level listeners so a fast finger that leaves the handle keeps dragging.
  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => move(dragging, valueAt(e.clientX));
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, move, valueAt]);

  const onTrackDown = (e) => {
    const v = valueAt(e.clientX);
    const handle = Math.abs(v - start) <= Math.abs(v - end) ? 'start' : 'end';
    move(handle, v);
    setDragging(handle);
  };

  const onKey = (handle) => (e) => {
    const cur = handle === 'start' ? start : end;
    const step = e.shiftKey ? 12 : 1;
    if (e.key === 'ArrowLeft') move(handle, cur - step);
    else if (e.key === 'ArrowRight') move(handle, cur + step);
    else if (e.key === 'Home') move(handle, min);
    else if (e.key === 'End') move(handle, max);
    else return;
    e.preventDefault();
  };

  const handleClass = (h) =>
    `absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-[3px] border-azure shadow ` +
    `cursor-grab touch-none focus:outline-none focus:ring-2 focus:ring-azure/40 ` +
    `before:absolute before:content-[''] before:-inset-3 ${dragging === h ? 'cursor-grabbing scale-110' : ''}`;

  return (
    <div className={`w-full select-none ${className}`}>
      <div
        ref={trackRef}
        className="relative h-2 rounded-full bg-gray-200 cursor-pointer touch-none"
        onPointerDown={onTrackDown}
      >
        <div
          className="absolute top-0 h-full rounded-full bg-azure"
          style={{ left: `${pct(start)}%`, width: `${pct(end) - pct(start)}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Range start"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={start}
          className={handleClass('start')}
          style={{ left: `${pct(start)}%` }}
          onPointerDown={(e) => { e.stopPropagation(); setDragging('start'); }}
          onKeyDown={onKey('start')}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Range end"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={end}
          className={handleClass('end')}
          style={{ left: `${pct(end)}%` }}
          onPointerDown={(e) => { e.stopPropagation(); setDragging('end'); }}
          onKeyDown={onKey('end')}
        />
      </div>
      {ticks.length > 0 && (
        <div className="relative h-4 mt-1.5 text-[10px] text-gray-500">
          {ticks.map((t) => (
            <span
              key={t.value}
              className="absolute -translate-x-1/2 tabular-nums"
              style={{ left: `${pct(t.value)}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RangeBrush;
