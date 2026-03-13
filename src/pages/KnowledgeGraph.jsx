import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Network, X, Info, BookOpen, AlertTriangle, TrendingUp } from "lucide-react";

function getColor(count) {
  if (count >= 4) return { fill: "#ef4444", stroke: "#fca5a5", glow: "rgba(239,68,68,0.5)", label: "Weak" };
  if (count >= 2) return { fill: "#f59e0b", stroke: "#fcd34d", glow: "rgba(245,158,11,0.5)", label: "Learning" };
  return { fill: "#10b981", stroke: "#34d399", glow: "rgba(16,185,129,0.5)", label: "Strong" };
}

function computePositions(nodes, W, H) {
  if (!nodes.length) return [];
  const cx = W / 2, cy = H / 2;
  const sorted = [...nodes].sort((a, b) => b.count - a.count);

  if (sorted.length === 1) return [{ ...sorted[0], x: cx, y: cy, r: 36 }];

  const innerCount = Math.min(Math.ceil(sorted.length * 0.35), 5);
  const result = [];

  sorted.forEach((n, i) => {
    const isInner = i < innerCount;
    const groupNodes = isInner ? sorted.slice(0, innerCount) : sorted.slice(innerCount);
    const groupIndex = isInner ? i : i - innerCount;
    const groupLen = groupNodes.length;
    const radius = isInner
      ? Math.min(W, H) * (sorted.length > 6 ? 0.17 : 0.2)
      : Math.min(W, H) * (sorted.length > 10 ? 0.38 : 0.32);
    const angle = (2 * Math.PI * groupIndex) / groupLen - Math.PI / 2;
    const nodeR = isInner
      ? Math.max(24, Math.min(44, 18 + n.count * 5))
      : Math.max(18, Math.min(34, 14 + n.count * 4));
    result.push({ ...n, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), r: nodeR });
  });

  return result;
}

export default function KnowledgeGraph() {
  const [selected, setSelected] = useState(null);
  const [dims, setDims] = useState({ w: 800, h: 560 });
  const containerRef = useRef(null);
  const animRef = useRef(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ w: rect.width || 800, h: Math.max(460, window.innerHeight - 240) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { data: errors = [], isLoading } = useQuery({
    queryKey: ["error_book_graph"],
    queryFn: () => base44.entities.ErrorBookEntry.list("-error_count", 300),
  });

  const nodes = useMemo(() => {
    const map = {};
    errors.forEach(e => {
      const k = e.core_test_point || "Uncategorized";
      if (!map[k]) map[k] = { label: k, count: 0, entries: [] };
      map[k].count += (e.error_count || 1);
      map[k].entries.push(e);
    });
    return Object.values(map);
  }, [errors]);

  const positioned = useMemo(() => computePositions(nodes, dims.w, dims.h), [nodes, dims]);

  const edges = useMemo(() => {
    const result = [];
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const dI = new Set((positioned[i].entries || []).map(e => e.error_date));
        const shared = (positioned[j].entries || []).some(e => dI.has(e.error_date));
        if (shared) result.push([i, j, "shared"]);
        else if (result.filter(e => e[0] === i || e[1] === i).length < 2 && Math.random() > 0.65) {
          result.push([i, j, "weak"]);
        }
      }
    }
    return result;
  }, [positioned]);

  const stats = useMemo(() => ({
    total: nodes.length,
    weak: nodes.filter(n => n.count >= 4).length,
    learning: nodes.filter(n => n.count >= 2 && n.count < 4).length,
    strong: nodes.filter(n => n.count < 2).length,
  }), [nodes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Knowledge Graph</h1>
                <p className="text-xs text-slate-400">{stats.total} concepts mapped from your learning journey</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-400">Weak ({stats.weak})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">Learning ({stats.learning})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Strong ({stats.strong})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Building your knowledge map…</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
              <Network className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No concepts mapped yet</p>
            <p className="text-slate-600 text-sm">Complete check-ins and the AI will build your personal knowledge graph</p>
          </div>
        ) : (
          <div className="flex gap-6 items-start">
            {/* SVG Graph */}
            <div
              ref={containerRef}
              className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden"
            >
              <svg width="100%" height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`}>
                <defs>
                  <filter id="blur-glow">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  {positioned.map((n, i) => {
                    const c = getColor(n.count);
                    return (
                      <radialGradient key={i} id={`ng${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={c.fill} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={c.fill} stopOpacity="0" />
                      </radialGradient>
                    );
                  })}
                </defs>

                {/* Edges */}
                {edges.map(([fi, ti, type], i) => {
                  const f = positioned[fi], t = positioned[ti];
                  if (!f || !t) return null;
                  return (
                    <line key={i}
                      x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                      stroke={type === "shared" ? "rgba(139,92,246,0.25)" : "rgba(148,163,184,0.1)"}
                      strokeWidth={type === "shared" ? 1.5 : 0.8}
                      strokeDasharray={type === "weak" ? "4 4" : undefined}
                    />
                  );
                })}

                {/* Nodes */}
                {positioned.map((n, i) => {
                  const c = getColor(n.count);
                  const isSelected = selected?.label === n.label;
                  const isDimmed = selected && !isSelected;
                  return (
                    <g key={i} onClick={() => setSelected(isSelected ? null : n)} className="cursor-pointer">
                      {/* Glow */}
                      <circle cx={n.x} cy={n.y} r={n.r + 18} fill={`url(#ng${i})`} />
                      {/* Node body */}
                      <circle
                        cx={n.x} cy={n.y} r={n.r}
                        fill={c.fill}
                        stroke={isSelected ? "#fff" : c.stroke}
                        strokeWidth={isSelected ? 3 : 1.5}
                        opacity={isDimmed ? 0.3 : 1}
                        className="transition-all duration-200"
                      />
                      {/* Count */}
                      <text x={n.x} y={n.y + 1}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="white" fontSize={n.r > 28 ? 13 : 10} fontWeight="bold"
                        opacity={isDimmed ? 0.3 : 1}
                      >{n.count}</text>
                      {/* Label */}
                      <text x={n.x} y={n.y + n.r + 14}
                        textAnchor="middle"
                        fill={isDimmed ? "rgba(148,163,184,0.25)" : "#94a3b8"}
                        fontSize="10" className="transition-all"
                      >
                        {n.label.length > 22 ? n.label.slice(0, 20) + "…" : n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Detail Panel */}
            {selected ? (
              <div className="w-72 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 self-start sticky top-24 shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-white leading-snug pr-2">{selected.label}</h3>
                  <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Error Count</span>
                    <span className={`font-bold ${getColor(selected.count).label === "Weak" ? "text-red-400" : getColor(selected.count).label === "Learning" ? "text-amber-400" : "text-emerald-400"}`}>
                      {selected.count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Mastery Status</span>
                    <span className={`text-sm font-bold ${getColor(selected.count).label === "Weak" ? "text-red-400" : getColor(selected.count).label === "Learning" ? "text-amber-400" : "text-emerald-400"}`}>
                      {selected.count >= 4 ? "⚠️ Weak" : selected.count >= 2 ? "📈 Learning" : "✅ Strong"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/50">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Recent errors in this topic:</p>
                  <div className="space-y-1.5">
                    {(selected.entries || []).slice(0, 3).map((e, i) => (
                      <div key={i} className="text-xs text-slate-500 bg-slate-700/40 rounded-lg p-2 leading-relaxed">
                        {e.question_condensed || (e.original_question || "").slice(0, 90) || "—"}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500">
                    {selected.count >= 4
                      ? "🔴 This is a high-priority weak point. Focus extra time here."
                      : selected.count >= 2
                      ? "🟡 You're improving! A few more practice rounds will solidify this."
                      : "🟢 Well done! You've mastered this concept."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-72 bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5 self-start sticky top-24 shrink-0 hidden lg:block">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-400">How to read this</p>
                </div>
                <div className="space-y-3 text-xs text-slate-500">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0 mt-0.5" />
                    <p><strong className="text-red-400">Red nodes</strong> = weak points (4+ errors). Prioritize these.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-0.5" />
                    <p><strong className="text-amber-400">Amber nodes</strong> = still learning (2–3 errors). Practice more.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                    <p><strong className="text-emerald-400">Green nodes</strong> = mastered (0–1 errors). Keep it up!</p>
                  </div>
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <BookOpen className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                    <p>Node size reflects error frequency. Click any node to explore details.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}