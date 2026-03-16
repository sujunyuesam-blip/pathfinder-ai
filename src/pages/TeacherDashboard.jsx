import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Users, BookOpen, Trophy, BarChart3, ChevronDown, ChevronUp, Copy, CheckCircle, Hash, ShieldCheck, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

  const sorted = [...records.filter(r => r.status === 'completed')].sort((a, b) => b.day_number - a.day_number);
  let streak = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].day_number === (sorted[0]?.day_number - i)) streak++;
    else break;
  }

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-colors">
      <button className="w-full text-left p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
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
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Learning Plans</p>
            <div className="space-y-2">
              {plans.length === 0 ? <p className="text-xs text-slate-400">No plans yet</p> : plans.map(plan => (
                <div key={plan.id} className="bg-white rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{plan.program_name}</p>
                    <Badge className={plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>Day {plan.current_day} / {plan.total_duration}</span>
                    <span>🎯 {plan.minimum_goal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

function ClassCodeBanner({ classroom }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(classroom.class_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Hash className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-700">{classroom.class_name}</p>
        <p className="text-xs text-slate-500">Share this code with your students</p>
      </div>
      <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-2">
        <span className="font-mono text-xl font-bold text-blue-700 tracking-widest">{classroom.class_code}</span>
        <button onClick={copy} className="ml-2 text-slate-400 hover:text-blue-600 transition-colors">
          {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const [filterPlan, setFilterPlan] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Load teacher's own classroom
  const { data: classrooms = [] } = useQuery({
    queryKey: ['my-classroom', currentUser?.email],
    queryFn: () => base44.entities.Classroom.filter({ teacher_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });
  const classroom = classrooms[0];

  // Students in this class
  const enrolledEmails = classroom?.student_emails || [];

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

  // Filter plans/records to only enrolled students
  const myPlans = classroom
    ? allPlans.filter(p => enrolledEmails.includes(p.created_by))
    : [];

  const myRecords = classroom
    ? allRecords.filter(r => enrolledEmails.includes(r.created_by))
    : [];

  // Group by student
  const studentMap = {};
  enrolledEmails.forEach(email => {
    studentMap[email] = { email, plans: [], records: [] };
  });
  myPlans.forEach(plan => {
    if (studentMap[plan.created_by]) studentMap[plan.created_by].plans.push(plan);
  });
  myRecords.forEach(rec => {
    if (studentMap[rec.created_by]) studentMap[rec.created_by].records.push(rec);
  });

  const students = Object.values(studentMap);
  const filtered = filterPlan
    ? students.filter(s => s.plans.some(p => p.program_name.toLowerCase().includes(filterPlan.toLowerCase())))
    : students;

  const totalCompleted = myRecords.filter(r => r.status === 'completed').length;
  const avgOverall = (() => {
    const withAcc = myRecords.filter(r => r.basic_accuracy != null);
    if (!withAcc.length) return null;
    return Math.round(withAcc.reduce((s, r) => s + r.basic_accuracy, 0) / withAcc.length);
  })();

  const tabs = [
    { id: "students", label: "My Students", icon: Users },
    { id: "admin", label: "Admin Panel", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" /> Teacher Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your students and manage your class</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {activeTab === "students" && (
          <>
            {/* Class Code Banner */}
            {classroom && <ClassCodeBanner classroom={classroom} />}
            {!classroom && !isLoading && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700">
                ⚠️ No classroom found. You may have registered before this feature was added. Please switch role and re-register as Teacher to create a class.
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Students", value: enrolledEmails.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Active Plans", value: myPlans.filter(p => p.status === 'active').length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Days Completed", value: totalCompleted, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Avg Accuracy", value: avgOverall != null ? `${avgOverall}%` : "—", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
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

            <div className="mb-4">
              <input type="text" placeholder="Filter by program name..."
                value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                className="w-full h-10 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400">Loading student data...</div>
            ) : !classroom ? (
              <div className="py-12 text-center">
                <Hash className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400">Create a class to start tracking students</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No students have joined yet</p>
                <p className="text-xs text-slate-300 mt-1">Share your class code <strong className="text-slate-400">{classroom.class_code}</strong> so students can join</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((student, i) => (
                  <StudentCard key={i} email={student.email} plans={student.plans} records={student.records} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "admin" && (
          <AdminPanelEmbed />
        )}
      </div>
    </div>
  );
}

// Inline Admin Panel for teachers
function AdminPanelEmbed() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['all-plans-admin'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 200),
  });
  const { data: records = [] } = useQuery({
    queryKey: ['all-records-admin'],
    queryFn: () => base44.entities.CheckInRecord.list('-created_date', 500),
  });
  const { data: classrooms = [] } = useQuery({
    queryKey: ['all-classrooms-admin'],
    queryFn: () => base44.entities.Classroom.list('-created_date', 100),
  });

  const userMap = {};
  plans.forEach(plan => {
    const u = plan.created_by || "unknown";
    if (!userMap[u]) userMap[u] = { email: u, plans: [], totalDays: 0 };
    userMap[u].plans.push(plan);
  });
  records.forEach(rec => {
    if (rec.created_by && userMap[rec.created_by] && rec.status === 'completed') {
      userMap[rec.created_by].totalDays++;
    }
  });
  const users = Object.values(userMap).sort((a, b) => b.plans.length - a.plans.length);

  const [copied, setCopied] = React.useState({});
  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(p => ({ ...p, [id]: true }));
    setTimeout(() => setCopied(p => ({ ...p, [id]: false })), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Users", value: users.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Learning Plans", value: plans.length, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Classrooms", value: classrooms.length, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classrooms */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">All Classrooms</h3>
        <div className="space-y-2">
          {classrooms.map(c => (
            <div key={c.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{c.class_name}</p>
                <p className="text-xs text-slate-400">{c.teacher_email} · {(c.student_emails || []).length} students</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-600">{c.class_code}</span>
                <button onClick={() => copyId(c.class_code)} className="text-slate-300 hover:text-slate-600">
                  {copied[c.class_code] ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
          {!classrooms.length && <p className="text-sm text-slate-400">No classrooms yet</p>}
        </div>
      </div>

      {/* All users */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">All Users & Plans</h3>
        {isLoading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                      {u.email[0]?.toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-slate-700 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{u.plans.length} plan(s)</span>
                    <span className="text-emerald-600 font-medium">{u.totalDays} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}