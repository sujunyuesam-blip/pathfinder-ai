import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./LanguageContext";

export default function AuthGuard({ children }) {
  const { t, toggleLang } = useLang();
  const [status, setStatus] = useState("checking"); // checking | authed | guest

  useEffect(() => {
    base44.auth.isAuthenticated().then(auth => {
      setStatus(auth ? "authed" : "guest");
    });
  }, []);

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
        <button
          onClick={toggleLang}
          className="fixed top-4 right-4 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
        >
          {t.language}
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{t.appName}</h1>
          <p className="text-slate-500 text-sm mb-8">{t.loginDesc}</p>
          <Button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white h-11"
          >
            {t.loginBtn}
          </Button>
        </div>
      </div>
    );
  }

  return children;
}