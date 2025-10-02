import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { X, Calendar, ZoomIn, ZoomOut, Maximize2, TrendingUp } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";

// Optimized DraggableBar Component
const DraggableBar = ({ min = 0, max = 100, value, onChange, disabled = false }) => {
  const trackRef = useRef(null);
  const x = useMotionValue(0);

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const valueToPercent = (v) => ((v - min) / (max - min)) * 100;

  useEffect(() => {
    const pct = valueToPercent(value);
    if (!trackRef.current) return;
    const width = trackRef.current.clientWidth || 1;
    const px = (pct / 100) * width;
    animate(x, px, { type: 'spring', stiffness: 300, damping: 30 });
  }, [value, x, min, max]);

  const pointerToValue = useCallback(
    (clientX) => {
      const rect = trackRef.current.getBoundingClientRect();
      const clampedPx = clamp(clientX - rect.left, 0, rect.width);
      const pct = (clampedPx / rect.width) * 100;
      return min + (pct / 100) * (max - min);
    },
    [min, max]
  );

  useEffect(() => {
    if (!trackRef.current || disabled) return;
    const track = trackRef.current;
    let dragging = false;

    const onPointerDown = (e) => {
      dragging = true;
      track.setPointerCapture?.(e.pointerId);
      onChange(pointerToValue(e.clientX));
    };

    const onPointerMove = (e) => {
      if (!dragging) return;
      onChange(pointerToValue(e.clientX));
    };

    const onPointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      track.releasePointerCapture?.(e.pointerId);
    };

    track.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [pointerToValue, onChange, disabled]);

  return (
    <div className="w-full px-6 py-3 bg-gray-50 border-y border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Pan View:</span>
        <div
          ref={trackRef}
          className={`relative flex-1 h-2 rounded-full bg-gray-300 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-blue-500"
            style={{ width: `${valueToPercent(value)}%` }}
          />
          <motion.div
            style={{ x }}
            className="absolute -top-1 h-4 w-4 rounded-full bg-white shadow-lg border-2 border-blue-500 cursor-grab active:cursor-grabbing"
          >
            <div className="h-full w-full rounded-full bg-blue-500/30" />
          </motion.div>
        </div>
        <span className="text-xs text-gray-500 w-16 text-right tabular-nums">
          {((value / max) * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

export default DraggableBar;