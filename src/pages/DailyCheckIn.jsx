import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import ContentDisplay from "../components/learning/ContentDisplay";
import AnswerSubmission from "../components/learning/AnswerSubmission";
import {
  buildContentGeneratorPrompt,
  buildGradingPrompt,
  buildConflictAvoidancePrompt
} from "../components/learning/PromptEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ChevronRight, Zap, Flame, Shield, Trophy, Star, Target, Swords } from "lucide-react";
import GeneratingProgress from "../components/learning/GeneratingProgress";

function XPBar({ current, max, label }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-amber-700 font-semibold">{label}</span>
        <span className="text-amber-600 font-mono">{current}/{max} XP</span>
      </div>
      <div className="h-3 bg-amber-100 rounded-full overflow-hidden border border-amber-200">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AccuracyBar({ value, label, color }) {
  const pct = value || 0;
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold font-mono ${color}`}>{pct}%</span>
      </div>
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            pct >= 85 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
            pct >= 60 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
            'bg-gradient-to-r from-red-400 to-rose-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MissionBadge({ status, day }) {
  if (status === 'completed') return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full">
      <Trophy className="w-3.5 h-3.5 text-emerald-600" />
      <span className="text-xs font-bold text-emerald-700">MISSION COMPLETE</span>
    </div>
  );
  if (status === 'pending_answers') return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full">
      <Swords className="w-3.5 h-3.5 text-amber-600" />
      <span className="text-xs font-bold text-amber-700">AWAITING COMBAT</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full">
      <Star className="w-3.5 h-3.5 text-blue-600" />
      <span className="text-xs font-bold text-blue-700">DAY {day}</span>
    </div>
  );
}

export default function DailyCheckIn() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordIdParam = urlParams.get("record_id");

  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [viewMode, setViewMode] = useState("content");
  const [xpAnimated, setXpAnimated] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.LearningPlan.list('-created_date', 1),
    initialData: []
  });
  const plan = plans[0];

  const { data: records } = useQuery({
    queryKey: ['records', plan?.id],
    queryFn: () => base44.entities.CheckInRecord.filter({ plan_id: plan?.id }, '-day_number', 100),
    enabled: !!plan,
    initialData: []
  });

  const { data: errors } = useQuery({
    queryKey: ['errors', plan?.id],
    queryFn: () => base44.entities.ErrorBookEntry.filter({ plan_id: plan?.id }, '-created_date', 500),
    enabled: !!plan,
    initialData: []
  });

  const currentRecord = recordIdParam
    ? records.find(r => r.id === recordIdParam)
    : records[0];

  useEffect(() => {
    if (currentRecord) {
      if (currentRecord.grading_result) setViewMode("grading");
      else if (currentRecord.status === "pending_answers") setViewMode("answers");
      else setViewMode("content");
    }
  }, [currentRecord?.id, currentRecord?.status]);

  useEffect(() => {
    if (viewMode === "grading") {
      setTimeout(() => setXpAnimated(true), 300);
    }
  }, [viewMode]);

  // Compute XP and streak
  const completedRecords = records.filter(r => r.status === 'completed' && r.basic_accuracy != null);
  const totalXP = completedRecords.reduce((sum, r) => sum + Math.round((r.basic_accuracy || 0) + (r.advanced_accuracy || 0) * 1.5), 0);
  const level = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;

  // Compute streak
  const sortedCompleted = [...completedRecords].sort((a, b) => b.day_number - a.day_number);
  let streak = 0;
  for (let i = 0; i < sortedCompleted.length; i++) {
    if (sortedCompleted[i].day_number === (sortedCompleted[0]?.day_number - i)) streak++;
    else break;
  }

  const generateNewDay = async () => {
    if (!plan) return;
    setLoading(true);
    const nextDay = (plan.current_day || 0) + 1;
    const today = new Date().toISOString().split('T')[0];
    const isConflict = plan.conflict_avoidance_start && plan.conflict_avoidance_end &&
      today >= plan.conflict_avoidance_start && today <= plan.conflict_avoidance_end;
    const yesterday = records.find(r => r.day_number === plan.current_day && r.status === 'completed');
    const needsConsolidation = yesterday && yesterday.basic_accuracy < 60;

    // Only pass last 5 errors to reduce token load
    const recentErrors = errors.slice(0, 5);

    if (isConflict) {
      setGenStatus("🛡️ Generating conflict avoidance content...");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildConflictAvoidancePrompt(plan, nextDay, recentErrors),
      });
      await base44.entities.CheckInRecord.create({
        plan_id: plan.id, day_number: nextDay, date: today,
        scenario_type: "conflict_avoidance", content: result, status: "pending_answers"
      });
    } else {
      let dayContext = `Day ${nextDay} of the plan.`;
      if (needsConsolidation) dayContext += `\n⚠️ SCHEDULE FIT RULE: Previous day basic accuracy was ${yesterday.basic_accuracy}% (<60%). SUSPEND new content. Do SPECIALIZED CONSOLIDATION.`;
      if (plan.full_plan_content) {
        const planSection = extractDayFromPlan(plan.full_plan_content, nextDay);
        if (planSection) dayContext += `\n\nFrom the master plan:\n${planSection}`;
      }
      const last2 = records.filter(r => r.status === 'completed').slice(0, 2);
      if (last2.length === 2 && last2.every(r => r.basic_accuracy >= 90)) {
        dayContext += `\n📈 SCHEDULE FIT RULE: User ≥90% for 2 consecutive days. Increase speed by 20%.`;
      }
      setGenStatus("📚 Generating today's mission content...");
      const contentResult = await base44.integrations.Core.InvokeLLM({
        prompt: buildContentGeneratorPrompt(plan, dayContext, nextDay, recentErrors),
      });
      await base44.entities.CheckInRecord.create({
        plan_id: plan.id, day_number: nextDay, date: today,
        scenario_type: "daily_checkin", content: contentResult, status: "pending_answers"
      });
    }

    await base44.entities.LearningPlan.update(plan.id, {
      current_day: nextDay,
      current_phase: isConflict ? "conflict_avoidance" : plan.current_phase
    });

    queryClient.invalidateQueries({ queryKey: ['records'] });
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    setLoading(false);
    setGenStatus("");
  };

  const handleAnswerSubmit = async (answers) => {
    if (!currentRecord || !plan) return;
    setLoading(true);
    await base44.entities.CheckInRecord.update(currentRecord.id, {
      user_answers_basic: answers.basic,
      user_answers_advanced: answers.advanced,
      status: "pending_grading"
    });
    setGenStatus("⚔️ Grading your battle performance...");
    const gradingResult = await base44.integrations.Core.InvokeLLM({
      prompt: buildGradingPrompt(plan, currentRecord.content, answers.formatted, errors.slice(0, 10)),
    });

    let basicAccuracy = 0, advancedAccuracy = 0, newErrors = [];
    const jsonMatch = gradingResult.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        basicAccuracy = Math.round((parsed.basic_correct / parsed.basic_total) * 100);
        advancedAccuracy = parsed.advanced_total > 0 ? Math.round((parsed.advanced_correct / parsed.advanced_total) * 100) : 0;
        newErrors = parsed.new_errors || [];
      } catch (e) {
        const basicMatch = gradingResult.match(/Basic.*?(\d+).*?\/.*?10.*?(\d+)%/);
        if (basicMatch) basicAccuracy = parseInt(basicMatch[2]);
      }
    }

    if (newErrors.length > 0) {
      await base44.entities.ErrorBookEntry.bulkCreate(
        newErrors.map(err => ({
          plan_id: plan.id,
          error_date: currentRecord.date || new Date().toISOString().split('T')[0],
          day_number: currentRecord.day_number,
          original_question: err.original_question,
          question_condensed: err.question_condensed,
          user_answer: err.user_answer,
          correct_answer: err.correct_answer,
          error_reason: err.error_reason,
          core_test_point: err.core_test_point,
          question_type: err.question_type || "basic",
          review_completed: false,
          error_count: 1
        }))
      );
    }

    await base44.entities.CheckInRecord.update(currentRecord.id, {
      grading_result: gradingResult,
      basic_accuracy: basicAccuracy,
      advanced_accuracy: advancedAccuracy,
      status: "completed"
    });

    queryClient.invalidateQueries({ queryKey: ['records'] });
    queryClient.invalidateQueries({ queryKey: ['errors'] });
    setLoading(false);
    setGenStatus("");
    setViewMode("grading");
  };

  function extractDayFromPlan(planText, dayNum) {
    const regex = new RegExp(`Day\\s*${dayNum}[\\s\\S]*?(?=Day\\s*${dayNum + 1}|Phase|$)`, 'i');
    const match = planText.match(regex);
    return match ? match[0].slice(0, 1500) : null;
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No active mission found</p>
          <Button onClick={() => window.location.href = createPageUrl("Setup")} className="bg-amber-500 hover:bg-amber-400 text-white">
            Start Your Journey
          </Button>
        </div>
      </div>
    );
  }

  const earnedXP = currentRecord
    ? Math.round((currentRecord.basic_accuracy || 0) + (currentRecord.advanced_accuracy || 0) * 1.5)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => window.location.href = createPageUrl("Dashboard")}
            className="text-slate-500 gap-2 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Base
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 border border-orange-200 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-600">{streak} streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 border border-violet-200 rounded-full">
              <Zap className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-bold text-violet-700">Lv.{level}</span>
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{plan.program_name}</p>
                <p className="text-xs text-slate-400">Level {level} Scholar · {totalXP} XP total</p>
              </div>
            </div>
            {currentRecord && <MissionBadge status={currentRecord.status} day={currentRecord.day_number} />}
          </div>
          <XPBar current={xpInLevel} max={500} label={`Level ${level} Progress`} />
        </div>

        {/* Loading */}
        <GeneratingProgress
          active={loading}
          label={genStatus}
          subLabel="AI is preparing your mission content..."
          durationSeconds={50}
        />

        {/* No record yet */}
        {!loading && !currentRecord && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Swords className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready for Day 1?</h2>
            <p className="text-slate-500 mb-6">Your first mission awaits. Begin your study journey!</p>
            <Button onClick={generateNewDay}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white gap-2 h-12 px-8 shadow-md font-bold">
              🗡️ Launch Mission <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!loading && currentRecord && (
          <>
            {/* Tab navigation */}
            <div className="flex gap-1.5 mb-5 bg-white rounded-xl p-1.5 shadow-sm border border-slate-100">
              {[
                { key: "content", label: "📜 Briefing", show: true },
                { key: "answers", label: "⚔️ Battle", show: currentRecord.status === "pending_answers" },
                { key: "grading", label: "🏆 Results", show: !!currentRecord.grading_result }
              ].filter(t => t.show).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    viewMode === tab.key
                      ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mission Briefing */}
            {viewMode === "content" && currentRecord.content && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Day {currentRecord.day_number} Mission Briefing</p>
                      <p className="text-blue-200 text-xs">Study carefully — battle follows</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-10">
                  <ContentDisplay content={currentRecord.content} />
                </div>
                {currentRecord.status === "pending_answers" && (
                  <div className="px-6 pb-6">
                    <Button
                      onClick={() => setViewMode("answers")}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold h-12 shadow-md"
                    >
                      ⚔️ Start Battle →
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Battle / Answer submission */}
            {viewMode === "answers" && currentRecord.status === "pending_answers" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Swords className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Battle Mode — Day {currentRecord.day_number}</p>
                      <p className="text-red-200 text-xs">Answer each question. Every point counts!</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <AnswerSubmission
                    onSubmit={handleAnswerSubmit}
                    loading={loading}
                    scenarioType={currentRecord.scenario_type}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {viewMode === "grading" && currentRecord.grading_result && (
              <div className="space-y-4">
                {/* XP earned card */}
                <div className={`rounded-2xl border overflow-hidden shadow-md ${
                  currentRecord.basic_accuracy >= 60
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400'
                    : 'bg-gradient-to-r from-rose-500 to-red-500 border-rose-400'
                }`}>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">
                        {currentRecord.basic_accuracy >= 85 ? '🏆 OUTSTANDING VICTORY' :
                         currentRecord.basic_accuracy >= 60 ? '✅ MISSION COMPLETE' : '❌ MISSION FAILED'}
                      </p>
                      <p className="text-white text-3xl font-black mt-1">+{earnedXP} XP</p>
                      <p className="text-white/70 text-xs mt-1">Day {currentRecord.day_number} complete</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {currentRecord.basic_accuracy != null && (
                    <div className="bg-black/10 px-5 pb-5 space-y-2.5">
                      <AccuracyBar
                        value={currentRecord.basic_accuracy}
                        label="Basic Questions"
                        color={currentRecord.basic_accuracy >= 85 ? 'text-white' : currentRecord.basic_accuracy >= 60 ? 'text-yellow-200' : 'text-red-200'}
                      />
                      {currentRecord.advanced_accuracy != null && (
                        <AccuracyBar
                          value={currentRecord.advanced_accuracy}
                          label="Advanced Questions"
                          color={currentRecord.advanced_accuracy >= 75 ? 'text-white' : 'text-yellow-200'}
                        />
                      )}
                    </div>
                  )}
                </div>

                {currentRecord.basic_accuracy < 60 && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <Shield className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-amber-700 text-sm font-medium">
                      ⚠️ Tomorrow will be a <strong>Consolidation Day</strong> — no new content, focus on weak points.
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                    <p className="font-bold text-slate-700 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" /> Detailed Battle Report
                    </p>
                  </div>
                  <div className="p-6 md:p-10">
                    <ContentDisplay content={currentRecord.grading_result} />
                  </div>
                </div>
              </div>
            )}

            {/* Next mission button */}
            {currentRecord.status === "completed" && (
              <div className="mt-6">
                <Button
                  onClick={generateNewDay}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white gap-2 h-14 text-base font-bold shadow-md rounded-xl"
                >
                  🗡️ Launch Day {(plan.current_day || 0) + 1} Mission <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}