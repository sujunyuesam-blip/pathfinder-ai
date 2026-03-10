import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Loader2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthGuard({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authed | guest | profile
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) { setStatus("guest"); return; }
      const me = await base44.auth.me();
      setUser(me);
      // If no phone number saved yet, prompt for it
      if (!me.phone_number) {
        setStatus("profile");
      } else {
        setStatus("authed");
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    if (!phone.trim()) return;
    setSaving(true);
    await base44.auth.updateMe({ phone_number: phone.trim() });
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">LearnAgent</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to access your learning plans</p>
          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white h-11"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  if (status === "profile") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-sm w-full">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-1 text-center">Complete Your Profile</h1>
          <p className="text-slate-500 text-sm mb-6 text-center">Add your contact info to get started</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Email</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{user?.email}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Phone Number</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-transparent">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 px-0 h-10"
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                />
              </div>
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={!phone.trim() || saving}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white h-11 mt-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Continue"}
            </Button>
            <button
              onClick={() => setStatus("authed")}
              className="w-full text-xs text-slate-400 hover:text-slate-600 text-center"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}