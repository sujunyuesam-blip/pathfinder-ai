import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Users, BookOpen, Trophy, Calendar, BarChart3, ChevronDown, ChevronUp, Target, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AccuracyPill({ value, label }) {
  if (value == null) return null;
  const color = value >= 85 ? "bg-emerald-100 text-emerald-700" : value >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${color}`}>{label}: {value}%</span>;
}

function StudentCard({ email, plans, records }) {
  const [expanded, setExpanded] = useState(false);
  const completedDays = records.filter(r => r.status === 'completed').length;
  const activePlan = plans.find(p => p.status === 'active');
  const recentRecords = records.filter(r => r.status === 'completed' && r.basic_accuracy != null)
    .sort((a, b) => b.day_number - a.day_number).slice(0, 5);
  const avgBasic = recentRecords.length
    ? Math.round(recentRecords.reduce((s, r) => s + r.basic_accuracy, 0) / recentRecords.length) : null;

  // Streak
  const sorted = [...records.filter(r => r.status === 'completed')].sort((a, b) => b.day_number - a.day_number);
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].day_number === (sorted[0]?.day_number - i)) streak++;
    else break;
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-colors">
      <button
        className="w-full text-left p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {email[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{email}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {activePlan && <span className="text-xs text-slate-500">📘 {activePlan.program_name}</span>}
              <span className="text-xs text-emerald-600 font-medium">✅ {completedDays} days</span>
              {streak > 1 && <span className="text-xs text-orange-500 font-medium">🔥 {streak} streak</span>}
              {avgBasic != null && <AccuracyPill value={avgBasic} label="avg" />}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-4">
          {/* Plans summary */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Learning Plans</p>
            <div className="space-y-2">
              {plans.map(plan => (
                <div key={plan.id} className="bg-white rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{plan.program_name}</p>
                    <Badge className={plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>Day {plan.current_day} / {plan.total_duration}</span>
                    <span>🎯 Min: {plan.minimum_goal}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>⚡ Sprint: {plan.sprint_goal}</span>
                    <span>⏱ {plan.daily_available_minutes} min/day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent check-ins */}
          {recentRecords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent Sessions</p>
              <div className="space-y-1.5">
                {recentRecords.map(rec => (
                  <div key={rec.id} className="bg-white rounded-lg border border-slate-100 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Day {rec.day_number}</span>
                      <span className="text-xs text-slate-500">{rec.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AccuracyPill value={rec.basic_accuracy} label="B" />
                      {rec.advanced_accuracy != null && <AccuracyPill value={rec.advanced_accuracy} label="A" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  const [filterPlan, setFilterPlan] = useState("");

  const { data: allPlans, isLoading } = useQuery({
    queryKey: ['teacher-plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 500),
    initialData: []
  });

  const { data: allRecords } = useQuery({
    queryKey: ['teacher-records'],
    queryFn: () => base44.entities.CheckInRecord.list('-created_date', 1000),
    initialData: []
  });

  // Group by student (created_by)
  const studentMap = {};
  allPlans.forEach(plan => {
    const email = plan.created_by || "unknown";
    if (!studentMap[email]) studentMap[email] = { email, plans: [], records: [] };
    studentMap[email].plans.push(plan);
  });
  allRecords.forEach(rec => {
    const email = rec.created_by || "unknown";
    if (studentMap[email]) studentMap[email].records.push(rec);
  });

  const students = Object.values(studentMap);

  // Filter
  const filtered = filterPlan
    ? students.filter(s => s.plans.some(p => p.program_name.toLowerCase().includes(filterPlan.toLowerCase())))
    : students;

  const totalCompleted = allRecords.filter(r => r.status === 'completed').length;
  const avgOverall = (() => {
    const withAcc = allRecords.filter(r => r.basic_accuracy != null);
    if (!withAcc.length) return null;
    return Math.round(withAcc.reduce((s, r) => s + r.basic_accuracy, 0) / withAcc.length);
  })();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" /> Teacher Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your students' learning progress</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Students", value: students.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Active Plans", value: allPlans.filter(p => p.status === 'active').length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Days Completed", value: totalCompleted, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Avg Accuracy", value: avgOverall != null ? `${avgOverall}%` : "—", icon: BarChart3, color: avgOverall >= 75 ? "text-emerald-600" : "text-amber-600", bg: "bg-amber-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by program name..."
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        {/* Students */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">Loading student data...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">No students found yet</p>
            <p className="text-xs text-slate-300 mt-1">Students will appear here once they create learning plans</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((student, i) => (
              <StudentCard
                key={i}
                email={student.email}
                plans={student.plans}
                records={student.records}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}