import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Loader2, GraduationCap, Users, Copy, CheckCircle, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function generateClassCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authed | guest | role | teacher_setup | student_code
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatedCode] = useState(generateClassCode());

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
    if (role === "teacher") {
      setStatus("teacher_setup");
    } else {
      setStatus("student_code");
    }
  };

  const handleTeacherSetup = async () => {
    if (!className.trim()) return;
    setSaving(true);
    const code = generatedCode;
    // Create a classroom record
    await base44.entities.Classroom.create({
      teacher_email: user.email,
      teacher_name: user.full_name || user.email,
      class_code: code,
      class_name: className.trim(),
      student_emails: []
    });
    await base44.auth.updateMe({ app_role: "teacher", class_code: code });
    setSaving(false);
    setStatus("authed");
  };

  const handleStudentJoin = async (skip = false) => {
    setSaving(true);
    setCodeError("");

    if (!skip && codeInput.trim()) {
      // Verify the class code exists
      const code = codeInput.trim().toUpperCase();
      const classrooms = await base44.entities.Classroom.filter({ class_code: code });
      if (!classrooms.length) {
        setCodeError("Class code not found. Check with your teacher or skip to continue.");
        setSaving(false);
        return;
      }
      // Add student to classroom
      const classroom = classrooms[0];
      const existing = Array.isArray(classroom.student_emails) ? classroom.student_emails : [];
      if (!existing.includes(user.email)) {
        await base44.entities.Classroom.update(classroom.id, {
          student_emails: [...existing, user.email]
        });
      }
      await base44.auth.updateMe({ app_role: "student", joined_class_code: code });
    } else {
      await base44.auth.updateMe({ app_role: "student" });
    }

    setSaving(false);
    setStatus("authed");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <p className="text-slate-500"><strong className="text-slate-700">Student</strong> — daily missions, XP, Socratic AI guide</p>
            </div>
            <div className="flex items-start gap-2 mt-1">
              <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-slate-500"><strong className="text-slate-700">Teacher</strong> — create a class, share a code, monitor your students</p>
            </div>
          </div>
          <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white h-11 font-semibold">
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
            <button onClick={() => handleSelectRole("student")} disabled={saving}
              className="w-full text-left p-4 border-2 border-slate-100 hover:border-violet-300 hover:bg-violet-50 rounded-xl transition-all group">
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
            <button onClick={() => handleSelectRole("teacher")} disabled={saving}
              className="w-full text-left p-4 border-2 border-slate-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">I'm a Teacher</p>
                  <p className="text-xs text-slate-500 mt-0.5">Create a class & monitor student progress</p>
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

  if (status === "teacher_setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Create Your Class</h2>
            <p className="text-slate-500 text-sm mt-1">Your students will use the class code to join</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1.5 block">Class Name</label>
              <Input
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="e.g. AP Economics Period 3"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1.5 block">Your Class Code</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <Hash className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="font-mono text-2xl font-bold text-slate-800 tracking-widest flex-1">{generatedCode}</span>
                <button onClick={copyCode} className="text-slate-400 hover:text-slate-700 transition-colors">
                  {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Share this code with your students so they can join your class</p>
            </div>

            <Button
              onClick={handleTeacherSetup}
              disabled={!className.trim() || saving}
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-semibold"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating class…</> : "Create Class & Continue"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "student_code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Join a Class</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your teacher's class code to connect</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1.5 block">Class Code (optional)</label>
              <Input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(""); }}
                placeholder="e.g. ABC123"
                className="h-11 font-mono text-center text-xl tracking-widest uppercase"
                maxLength={6}
              />
              {codeError && <p className="text-xs text-red-500 mt-1.5">{codeError}</p>}
              <p className="text-xs text-slate-400 mt-1.5">Don't have one? You can still use the app and join a class later.</p>
            </div>

            <Button
              onClick={() => handleStudentJoin(false)}
              disabled={saving || !codeInput.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 h-11 font-semibold"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Joining…</> : "Join Class & Continue"}
            </Button>

            <button
              onClick={() => handleStudentJoin(true)}
              disabled={saving}
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Skip — I'll join a class later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}