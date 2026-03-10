import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function ProgressStats({ records, errors }) {
  const completedRecords = (records || []).filter(r => r.status === "completed" && r.basic_accuracy != null);
  
  const accuracyData = completedRecords.map(r => ({
    day: `D${r.day_number}`,
    basic: r.basic_accuracy || 0,
    advanced: r.advanced_accuracy || 0
  }));

  const errorsByPoint = {};
  (errors || []).forEach(e => {
    errorsByPoint[e.core_test_point] = (errorsByPoint[e.core_test_point] || 0) + 1;
  });
  const topErrors = Object.entries(errorsByPoint)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([point, count]) => ({ point: point.length > 15 ? point.slice(0, 15) + '...' : point, count }));

  const totalBasicCorrect = completedRecords.reduce((s, r) => s + (r.basic_accuracy || 0), 0);
  const totalAdvCorrect = completedRecords.reduce((s, r) => s + (r.advanced_accuracy || 0), 0);
  const avgBasic = completedRecords.length ? Math.round(totalBasicCorrect / completedRecords.length) : 0;
  const avgAdv = completedRecords.length ? Math.round(totalAdvCorrect / completedRecords.length) : 0;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Days Completed", value: completedRecords.length, color: "text-slate-800" },
          { label: "Avg Basic Accuracy", value: `${avgBasic}%`, color: avgBasic >= 85 ? "text-emerald-600" : "text-amber-600" },
          { label: "Avg Sprint Accuracy", value: `${avgAdv}%`, color: avgAdv >= 75 ? "text-emerald-600" : "text-amber-600" },
          { label: "Total Errors", value: (errors || []).length, color: "text-red-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accuracy trend */}
      {accuracyData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Accuracy Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={accuracyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="basic" stroke="#10b981" strokeWidth={2} name="Basic %" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="advanced" stroke="#3b82f6" strokeWidth={2} name="Advanced %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top error points */}
      {topErrors.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">High-Frequency Error Points</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topErrors} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="point" tick={{ fontSize: 11 }} width={120} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Error Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}