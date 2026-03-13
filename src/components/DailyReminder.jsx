import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Flame, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function DailyReminder() {
  const [show, setShow] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const key = `daily_reminder_dismissed_${today}`;
    if (localStorage.getItem(key)) return;

    const check = async () => {
      try {
        const plans = await base44.entities.LearningPlan.filter({ status: "active" });
        if (!plans.length) return;
        const todayRecords = await base44.entities.CheckInRecord.filter({ date: today });
        const completed = todayRecords.filter(r => r.status === "completed");
        if (completed.length === 0) setShow(true);
      } catch (_) {}
    };
    check();

    if ("Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const dismiss = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    localStorage.setItem(`daily_reminder_dismissed_${today}`, "1");
    setShow(false);
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      new Notification("LearnAgent", {
        body: "Your daily mission awaits! Complete your check-in to keep your streak 🔥",
      });
    }
  };

  if (!show) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-4 mb-6 overflow-hidden">
      {/* Animated glow line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Daily Mission Awaits! 🔥</p>
          <p className="text-slate-500 text-xs mt-0.5">Complete today's check-in to maintain your streak and earn XP</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!notifEnabled && "Notification" in window && (
            <button
              onClick={enableNotifications}
              className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 border border-amber-200 rounded-full px-2.5 py-1"
            >
              <Bell className="w-3 h-3" />Enable reminders
            </button>
          )}
          <Link to={createPageUrl("DailyCheckIn")}>
            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-8 text-xs font-bold shadow-md shadow-amber-500/30 border-0">
              <Zap className="w-3.5 h-3.5 mr-1" />Go Now!
            </Button>
          </Link>
          <button onClick={dismiss} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}