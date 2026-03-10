import React from "react";
import { useLang } from "../components/LanguageContext";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import ContentDisplay from "../components/learning/ContentDisplay";

export default function PlanView() {
  const { t } = useLang();
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 1),
    initialData: []
  });
  const plan = plans[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = createPageUrl("Dashboard")}
            className="text-slate-500 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t.dashboard}
          </Button>
        </div>

        {plan ? (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-slate-600" />
                <h1 className="text-2xl font-bold text-slate-800">{plan.program_name}</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{t.fieldDuration}: {plan.total_duration}</span>
                <span>{t.dailyTime}: {plan.daily_available_minutes} min</span>
                {plan.conflict_avoidance_start && (
                  <span>Conflict: {plan.conflict_avoidance_start} → {plan.conflict_avoidance_end}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t.minimumGoal}</p>
...
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{t.sprintGoal}</p>
                <p className="text-slate-700">{plan.sprint_goal}</p>
              </div>
            </div>

            {plan.full_plan_content ? (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
                <ContentDisplay content={plan.full_plan_content} title="Full Learning Plan" />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>No detailed plan content available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">No plan found</p>
            <Button onClick={() => window.location.href = createPageUrl("Setup")} className="bg-slate-800 text-white">
              Create a Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}