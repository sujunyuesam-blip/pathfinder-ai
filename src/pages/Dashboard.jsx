import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Calendar, Target, ArrowRight, Plus, BarChart3, BookMarked, Clock, Sparkles, Network, MessageSquare } from "lucide-react";
import ProgressStats from "../components/learning/ProgressStats";
import SocraticChatPanel from "../components/learning/SocraticChatPanel";
import DailyReminder from "../components/DailyReminder";

export default function Dashboard() {
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 10),
    initialData: []
  });

  const activePlan = plans.find(p => p.status === 'active');

  const { data: records } = useQuery({
    queryKey: ['records', activePlan?.id],
    queryFn: () => base44.entities.CheckInRecord.filter({ plan_id: activePlan?.id }, '-day_number', 100),
    enabled: !!activePlan,
    initialData: []
  });

  const { data: errors } = useQuery({
    queryKey: ['errors', activePlan?.id],
    queryFn: () => base44.entities.ErrorBookEntry.filter({ plan_id: activePlan?.id }, '-created_date', 500),
    enabled: !!activePlan,
    initialData: []
  });

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Learning Plan</h2>
          <p className="text-slate-500 mb-6">Set up your first learning plan to get started</p>
          <Button
            onClick={() => window.location.href = createPageUrl("Setup")}
            className="bg-slate-800 hover:bg-slate-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Create Learning Plan
          </Button>
        </div>
      </div>
    );
  }

  const latestRecord = records[0];
  const needsAnswers = latestRecord?.status === "pending_answers";
  const needsGrading = latestRecord?.status === "pending_grading";
  const isComplete = latestRecord?.status === "completed";
  const isConflictPeriod = activePlan.current_phase === "conflict_avoidance";

  return (
    <>
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Daily Reminder */}
        <DailyReminder />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{activePlan.program_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Day {activePlan.current_day} · {activePlan.total_duration} plan
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={
              activePlan.current_phase === 'intensive' ? 'bg-blue-100 text-blue-700' :
              activePlan.current_phase === 'conflict_avoidance' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }>
              {activePlan.current_phase === 'intensive' ? '📘 Intensive Phase' :
               activePlan.current_phase === 'conflict_avoidance' ? '🛡️ Conflict Avoidance' :
               '🚀 Final Sprint'}
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = createPageUrl("DailyCheckIn")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700">Daily Check-in</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {needsAnswers ? "Submit your answers" :
                   needsGrading ? "View grading results" :
                   isComplete ? "Generate next day" :
                   "Start today's learning"}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = createPageUrl("ErrorBook")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookMarked className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700">Error Book</p>
                <p className="text-xs text-slate-400 mt-0.5">{errors.length} errors recorded</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => window.location.href = createPageUrl("PlanView")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700">Full Plan</p>
                <p className="text-xs text-slate-400 mt-0.5">View complete learning roadmap</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </CardContent>
          </Card>
        </div>

        {/* Forum + Knowledge Graph row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-slate-900 to-slate-800 text-white"
            onClick={() => window.location.href = createPageUrl("SocraticForum")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">Socratic Forum</p>
                <p className="text-xs text-slate-400 mt-0.5">AI-examined community questions</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </CardContent>
          </Card>
          <Card
            className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-slate-900 to-slate-800 text-white"
            onClick={() => window.location.href = createPageUrl("KnowledgeGraph")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Network className="w-6 h-6 text-cyan-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">Knowledge Graph</p>
                <p className="text-xs text-slate-400 mt-0.5">Visual mastery map of all concepts</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </CardContent>
          </Card>
        </div>

        {/* Socratic Guide Banner */}
        <Card
          className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100"
          onClick={() => window.location.href = createPageUrl("SocraticChat")}
        >
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700">Socratic Learning Guide</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Stuck on a concept? Explore it through Socratic dialogue — both you and the AI grow together, step by step.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ArrowRight className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-violet-500 font-medium">Open Chat</span>
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                <Target className="w-4 h-4" /> Minimum Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{activePlan.minimum_goal}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500 flex items-center gap-2">
                🚀 Sprint Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">{activePlan.sprint_goal}</p>
            </CardContent>
          </Card>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: "Daily Time", value: `${activePlan.daily_available_minutes} min` },
            { icon: Calendar, label: "Start Date", value: activePlan.start_date || '-' },
            { icon: BarChart3, label: "Days Studied", value: records.filter(r => r.status === 'completed').length },
            { icon: BookMarked, label: "Errors to Review", value: errors.filter(e => !e.review_completed).length },
          ].map((item, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <item.icon className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="font-semibold text-slate-700">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Stats */}
        <ProgressStats records={records} errors={errors} />

        {/* Recent records */}
        {records.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {records.slice(0, 7).map(rec => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      const params = new URLSearchParams({ record_id: rec.id });
                      window.location.href = createPageUrl("DailyCheckIn") + "?" + params.toString();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-400">Day {rec.day_number}</span>
                      <span className="text-sm text-slate-600">{rec.date}</span>
                      <Badge variant="outline" className="text-xs">
                        {rec.scenario_type === 'conflict_avoidance' ? '🛡️ Insulation' : '📖 Study'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      {rec.basic_accuracy != null && (
                        <span className={`text-xs font-mono ${rec.basic_accuracy >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          DR: {rec.basic_accuracy}%
                        </span>
                      )}
                      {rec.advanced_accuracy != null && (
                        <span className={`text-xs font-mono ${rec.advanced_accuracy >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          AS: {rec.advanced_accuracy}%
                        </span>
                      )}
                      <Badge className={
                        rec.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        rec.status === 'pending_answers' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }>
                        {rec.status === 'completed' ? 'Done' :
                         rec.status === 'pending_answers' ? 'Awaiting Answers' :
                         rec.status === 'pending_grading' ? 'Awaiting Grading' : rec.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

    {/* Floating Socratic Chat Panel */}

    <SocraticChatPanel activePlan={activePlan} />
    </>
  );
}