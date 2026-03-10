import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import ContentDisplay from "../components/learning/ContentDisplay";
import AnswerSubmission from "../components/learning/AnswerSubmission";
import {
  buildContentGeneratorPrompt,
  buildGradingPrompt,
  buildSummaryPushPrompt,
  buildConflictAvoidancePrompt
} from "../components/learning/PromptEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";

export default function DailyCheckIn() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordIdParam = urlParams.get("record_id");

  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [viewMode, setViewMode] = useState("content"); // content, answers, grading

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

  // Find the current record to display
  const currentRecord = recordIdParam
    ? records.find(r => r.id === recordIdParam)
    : records[0]; // Latest record

  useEffect(() => {
    if (currentRecord) {
      if (currentRecord.grading_result) setViewMode("grading");
      else if (currentRecord.status === "pending_answers") setViewMode("answers");
      else setViewMode("content");
    }
  }, [currentRecord?.id, currentRecord?.status]);

  // Generate new day content
  const generateNewDay = async () => {
    if (!plan) return;
    setLoading(true);

    const nextDay = (plan.current_day || 0) + 1;
    const today = new Date().toISOString().split('T')[0];

    // Check if in conflict avoidance period
    const isConflict = plan.conflict_avoidance_start && plan.conflict_avoidance_end &&
      today >= plan.conflict_avoidance_start && today <= plan.conflict_avoidance_end;

    // Check schedule fit rule: if yesterday's basic accuracy < 60%, consolidate
    const yesterday = records.find(r => r.day_number === plan.current_day && r.status === 'completed');
    const needsConsolidation = yesterday && yesterday.basic_accuracy < 60;

    let scenarioType = isConflict ? "conflict_avoidance" : "daily_checkin";

    if (isConflict) {
      setGenStatus("🛡️ Generating conflict avoidance lightweight content...");
      const conflictPrompt = buildConflictAvoidancePrompt(plan, nextDay, errors);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: conflictPrompt,
        model: "claude_sonnet_4_6"
      });

      await base44.entities.CheckInRecord.create({
        plan_id: plan.id,
        day_number: nextDay,
        date: today,
        scenario_type: "conflict_avoidance",
        content: result,
        status: "pending_answers"
      });
    } else {
      // 3-model pipeline for daily content
      let dayContext = `Day ${nextDay} of the plan.`;
      if (needsConsolidation) {
        dayContext += `\n⚠️ SCHEDULE FIT RULE: Previous day basic accuracy was ${yesterday.basic_accuracy}% (<60%). SUSPEND new content. Do SPECIALIZED CONSOLIDATION of weak knowledge points only.`;
      }
      if (plan.full_plan_content) {
        const planSection = extractDayFromPlan(plan.full_plan_content, nextDay);
        if (planSection) dayContext += `\n\nFrom the master plan:\n${planSection}`;
      }

      // Check pace acceleration: 2 consecutive days >= 90%
      const last2 = records.filter(r => r.status === 'completed').slice(0, 2);
      if (last2.length === 2 && last2.every(r => r.basic_accuracy >= 90)) {
        dayContext += `\n📈 SCHEDULE FIT RULE: User has ≥90% accuracy for 2 consecutive days. You may increase speed by 20% and merge adjacent same-topic knowledge points.`;
      }

      setGenStatus("📚 Model 1/2: Content Generator producing today's lesson...");
      const contentPrompt = buildContentGeneratorPrompt(plan, dayContext, nextDay, errors);
      const contentResult = await base44.integrations.Core.InvokeLLM({
        prompt: contentPrompt,
        model: "claude_sonnet_4_6"
      });

      setGenStatus("✨ Model 2/2: Summary model formatting final output...");
      const summaryPrompt = buildSummaryPushPrompt("", contentResult, "Scenario 2: Daily check-in content");
      const summaryResult = await base44.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
        model: "claude_sonnet_4_6"
      });

      await base44.entities.CheckInRecord.create({
        plan_id: plan.id,
        day_number: nextDay,
        date: today,
        scenario_type: "daily_checkin",
        content: summaryResult,
        status: "pending_answers"
      });
    }

    // Update plan's current day
    await base44.entities.LearningPlan.update(plan.id, {
      current_day: nextDay,
      current_phase: isConflict ? "conflict_avoidance" : plan.current_phase
    });

    queryClient.invalidateQueries({ queryKey: ['records'] });
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    setLoading(false);
    setGenStatus("");
  };

  // Submit answers for grading
  const handleAnswerSubmit = async (answers) => {
    if (!currentRecord || !plan) return;
    setLoading(true);

    // Save user answers
    await base44.entities.CheckInRecord.update(currentRecord.id, {
      user_answers_basic: answers.basic,
      user_answers_advanced: answers.advanced,
      status: "pending_grading"
    });

    // Run grading pipeline
    setGenStatus("📊 Model 1/2: Content Generator grading your answers...");
    const gradingPrompt = buildGradingPrompt(plan, currentRecord.content, answers.formatted, errors);
    const gradingResult = await base44.integrations.Core.InvokeLLM({
      prompt: gradingPrompt,
      model: "claude_sonnet_4_6"
    });

    setGenStatus("✨ Model 2/2: Summary model formatting grading results...");
    const summaryPrompt = buildSummaryPushPrompt("", gradingResult, "Scenario 3: Answer grading and error analysis");
    const summaryResult = await base44.integrations.Core.InvokeLLM({
      prompt: summaryPrompt,
      model: "claude_sonnet_4_6"
    });

    // Parse accuracy and errors from grading result
    let basicAccuracy = 0;
    let advancedAccuracy = 0;
    let newErrors = [];

    const jsonMatch = gradingResult.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        basicAccuracy = Math.round((parsed.basic_correct / parsed.basic_total) * 100);
        advancedAccuracy = parsed.advanced_total > 0 ? Math.round((parsed.advanced_correct / parsed.advanced_total) * 100) : 0;
        newErrors = parsed.new_errors || [];
      } catch (e) {
        // Fallback: try to parse from text
        const basicMatch = gradingResult.match(/Basic.*?(\d+).*?\/.*?10.*?(\d+)%/);
        if (basicMatch) basicAccuracy = parseInt(basicMatch[2]);
      }
    }

    // Save errors to ErrorBook
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

    // Update record with grading results
    await base44.entities.CheckInRecord.update(currentRecord.id, {
      grading_result: summaryResult,
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No active plan found</p>
          <Button onClick={() => window.location.href = createPageUrl("Setup")} className="bg-slate-800 text-white">
            Create a Plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = createPageUrl("Dashboard")}
            className="text-slate-500 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
          {currentRecord && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Day {currentRecord.day_number}</Badge>
              <Badge className={
                currentRecord.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                currentRecord.status === 'pending_answers' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }>
                {currentRecord.status === 'completed' ? '✅ Complete' :
                 currentRecord.status === 'pending_answers' ? '📝 Awaiting Answers' :
                 '📊 Grading'}
              </Badge>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">{genStatus}</p>
            <p className="text-xs text-slate-400 mt-1">Using non-default model (uses more integration credits)</p>
          </div>
        )}

        {!loading && !currentRecord && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">Ready to start your first day of learning</p>
            <Button onClick={generateNewDay} className="bg-slate-800 text-white gap-2">
              Generate Day 1 Content <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!loading && currentRecord && (
          <>
            {/* Tab navigation */}
            <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
              {[
                { key: "content", label: "📖 Lesson", show: true },
                { key: "answers", label: "📝 Submit Answers", show: currentRecord.status === "pending_answers" },
                { key: "grading", label: "📊 Grading Results", show: !!currentRecord.grading_result }
              ].filter(t => t.show).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    viewMode === tab.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content view */}
            {viewMode === "content" && currentRecord.content && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
                <ContentDisplay content={currentRecord.content} />
              </div>
            )}

            {/* Answer submission */}
            {viewMode === "answers" && currentRecord.status === "pending_answers" && (
              <AnswerSubmission
                onSubmit={handleAnswerSubmit}
                loading={loading}
                scenarioType={currentRecord.scenario_type}
              />
            )}

            {/* Grading results */}
            {viewMode === "grading" && currentRecord.grading_result && (
              <div>
                {/* Accuracy summary bar */}
                {currentRecord.basic_accuracy != null && (
                  <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {currentRecord.basic_accuracy >= 60 ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      )}
                      <div>
                        <span className="text-sm text-slate-500">Basic: </span>
                        <span className={`font-bold ${currentRecord.basic_accuracy >= 85 ? 'text-emerald-600' : currentRecord.basic_accuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {currentRecord.basic_accuracy}%
                        </span>
                      </div>
                      {currentRecord.advanced_accuracy != null && (
                        <div>
                          <span className="text-sm text-slate-500">Advanced: </span>
                          <span className={`font-bold ${currentRecord.advanced_accuracy >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {currentRecord.advanced_accuracy}%
                          </span>
                        </div>
                      )}
                    </div>
                    {currentRecord.basic_accuracy < 60 && (
                      <Badge className="bg-red-100 text-red-700">
                        ⚠️ Tomorrow: Consolidation Day
                      </Badge>
                    )}
                  </div>
                )}
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-10">
                  <ContentDisplay content={currentRecord.grading_result} />
                </div>
              </div>
            )}

            {/* Next day button */}
            {currentRecord.status === "completed" && (
              <div className="mt-6 text-center">
                <Button
                  onClick={generateNewDay}
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-700 text-white gap-2 h-12 px-8"
                >
                  Generate Day {(plan.current_day || 0) + 1} Content <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}