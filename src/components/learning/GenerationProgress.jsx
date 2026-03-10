import React, { useEffect, useState } from "react";

export default function GenerationProgress({ steps, currentStepIndex, isComplete }) {
  const [fakeProgress, setFakeProgress] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setFakeProgress(100);
      return;
    }
    setFakeProgress(0);
    const interval = setInterval(() => {
      setFakeProgress(prev => {
        if (prev >= 92) { clearInterval(interval); return 92; }
        const increment = prev < 40 ? 3 : prev < 70 ? 1.5 : 0.5;
        return prev + increment;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [currentStepIndex, isComplete]);

  const progress = isComplete ? 100 : fakeProgress;

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-slate-800 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-start gap-2">
        {steps.map((step, i) => {
          const isDone = i < currentStepIndex || isComplete;
          const isActive = i === currentStepIndex && !isComplete;
          return (
            <div key={i} className="flex-1 text-center">
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isDone ? 'bg-emerald-500 text-white' :
                isActive ? 'bg-slate-800 text-white animate-pulse' :
                'bg-slate-200 text-slate-400'
              }`}>
                {isDone ? '✓' : i + 1}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-tight">{step}</p>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        {isComplete ? '✅ Done!' : `${Math.round(progress)}%`}
      </p>
    </div>
  );
}