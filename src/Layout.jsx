import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, LayoutDashboard, Calendar, BookMarked, Map, Menu, X } from "lucide-react";
import { LanguageProvider, useLang } from "./components/LanguageContext";
import AuthGuard from "./components/AuthGuard";

const NAV_ITEMS = [
  { nameKey: "dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { nameKey: "dailyCheckin", icon: Calendar, page: "DailyCheckIn" },
  { nameKey: "errorBook", icon: BookMarked, page: "ErrorBook" },
  { nameKey: "fullPlan", icon: Map, page: "PlanView" },
];

function LayoutInner({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  // React.useState is used via React.useState above - no separate import needed
  const { t, toggleLang } = useLang();

  // Hide sidebar on setup page
  if (currentPageName === "Setup") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-100 flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">{t.appName}</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {t[item.nameKey]}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            to={createPageUrl("Setup")}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t.newPlan}
          </Link>
          <button
            onClick={toggleLang}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Globe className="w-3 h-3" /> {t.language}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-30 px-4 py-3 flex items-center justify-between">
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-800">{t.appName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="text-xs px-2 py-1 border border-slate-200 rounded-full text-slate-500">
            {t.language}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-64 h-full p-4 pt-16" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => {
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
                    {t[item.nameKey]}
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
    <LanguageProvider>
      <AuthGuard>
        <LayoutInner currentPageName={currentPageName}>
          {children}
        </LayoutInner>
      </AuthGuard>
    </LanguageProvider>
  );
}