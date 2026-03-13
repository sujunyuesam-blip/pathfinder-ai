import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Loader2, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authed | guest | role
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) { setStatus("guest"); return; }
      const me = await base44.auth.me();
      setUser(me);
      if (!me.app_role) {
        setStatus("role");
      } else {
        setStatus("authed");
      }
    });
  }, []);

  const handleSelectRole = async (role) => {
    setSaving(true);
    await base44.auth.updateMe({ app_role: role });
    setStatus("authed");
    setSaving(false);
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">LearnAgent</h1>
          <p className="text-slate-500 text-sm mb-3">AI-powered Socratic learning platform</p>
          <div className="flex flex-col gap-2 mb-6 text-left text-xs bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="font-semibold text-slate-600 mb-1">Two ways to use this app:</p>
            <div className="flex items-start gap-2">
              <GraduationCap className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-slate-500"><strong className="text-slate-700">Student</strong> — follow daily missions, earn XP, chat with the Socratic AI guide</p>
            </div>
            <div className="flex items-start gap-2 mt-1">
              <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-slate-500"><strong className="text-slate-700">Teacher</strong> — monitor all your students' progress, accuracy, and streaks</p>
            </div>
          </div>
          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white h-11 font-semibold"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  if (status === "role") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Welcome, {user?.full_name || user?.email}!</h2>
            <p className="text-slate-500 text-sm mt-1">How will you use LearnAgent?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleSelectRole("student")}
              disabled={saving}
              className="w-full text-left p-4 border-2 border-slate-100 hover:border-violet-300 hover:bg-violet-50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 group-hover:bg-violet-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <GraduationCap className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">I'm a Student</p>
                  <p className="text-xs text-slate-500 mt-0.5">Daily missions, XP, Socratic AI guide</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleSelectRole("teacher")}
              disabled={saving}
              className="w-full text-left p-4 border-2 border-slate-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">I'm a Teacher</p>
                  <p className="text-xs text-slate-500 mt-0.5">Monitor student progress and learning stats</p>
                </div>
              </div>
            </button>
          </div>

          {saving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Setting up your account...
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}