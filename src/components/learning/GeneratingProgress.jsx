import React, { useEffect, useState } from "react";

export default function GeneratingProgress({ active, label, subLabel, durationSeconds = 45 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return p;
        const increment = p < 30 ? 2.5 : p < 60 ? 1.2 : p < 85 ? 0.5 : 0.15;
        return Math.min(95, p + increment);
      });
    }, (durationSeconds * 1000) / 100);
    return () => clearInterval(interval);
  }, [active, durationSeconds]);

  if (!active) return null;

  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-sm mx-auto">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-slate-700 font-medium mb-1">{label}</p>
        {subLabel && <p className="text-xs text-slate-400 mb-6">{subLabel}</p>}

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-2 bg-slate-800 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}