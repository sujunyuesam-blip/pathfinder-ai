import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, LayoutDashboard, Calendar, BookMarked, Map, Menu, X, Sparkles, Users, GraduationCap, Network, MessageSquare, RefreshCw } from "lucide-react";
import AuthGuard from "./components/AuthGuard";
import { base44 } from "@/api/base44Client";

const STUDENT_NAV = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Daily Check-in", icon: Calendar, page: "DailyCheckIn" },
  { name: "Socratic Guide", icon: Sparkles, page: "SocraticChat" },
  { name: "Error Book", icon: BookMarked, page: "ErrorBook" },
  { name: "Full Plan", icon: Map, page: "PlanView" },
  { name: "Knowledge Graph", icon: Network, page: "KnowledgeGraph" },
  { name: "Forum", icon: MessageSquare, page: "SocraticForum" },
];

const TEACHER_NAV = [
  { name: "Student Progress", icon: Users, page: "TeacherDashboard" },
];

const ADMIN_NAV = [];

function LayoutInner({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const switchRole = async () => {
    const newRole = (user?.app_role || "student") === "student" ? "teacher" : "student";
    await base44.auth.updateMe({ app_role: newRole });
    const updated = await base44.auth.me();
    setUser(updated);
    window.location.href = newRole === "teacher" ? createPageUrl("TeacherDashboard") : createPageUrl("Dashboard");
  };

  const appRole = user?.app_role || "student";
  const sysRole = user?.role;

  if (currentPageName === "Setup" || currentPageName === "SocraticChat") {
    return <>{children}</>;
  }

  const navItems = appRole === "teacher"
    ? [...TEACHER_NAV, ...(sysRole === "admin" ? ADMIN_NAV : [])]
    : [...STUDENT_NAV, ...(sysRole === "admin" ? ADMIN_NAV : [])];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <Link to={createPageUrl(appRole === "teacher" ? "TeacherDashboard" : "Dashboard")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">LearnAgent</span>
          </Link>
          {user && (
            <div className="mt-3 flex items-center gap-1.5">
              <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appRole === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                {appRole === "teacher" ? "👨‍🏫 Teacher" : "🎓 Student"}
              </div>
              <button
                onClick={switchRole}
                title={`Switch to ${appRole === "teacher" ? "Student" : "Teacher"}`}
                className="ml-auto text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {appRole === "student" && (
          <div className="p-4 border-t border-slate-100">
            <Link to={createPageUrl("Setup")} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              + New Learning Plan
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-30 px-4 py-3 flex items-center justify-between">
        <Link to={createPageUrl(appRole === "teacher" ? "TeacherDashboard" : "Dashboard")} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-800">LearnAgent</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-64 h-full p-4 pt-16" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthGuard>
      <LayoutInner currentPageName={currentPageName}>
        {children}
      </LayoutInner>
    </AuthGuard>
  );
}