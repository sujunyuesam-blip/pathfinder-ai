import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import SetupForm from "../components/learning/SetupForm";
import ContentDisplay from "../components/learning/ContentDisplay";
import GenerationProgress from "../components/learning/GenerationProgress";
import { buildLogicPlannerPrompt, buildContentGeneratorPrompt } from "../components/learning/PromptEngine";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "../components/LanguageContext";

export default function Setup() {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("form"); // form, generating, preview
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [genStepIndex, setGenStepIndex] = useState(0);
  const [genComplete, setGenComplete] = useState(false);

  const STEPS = [t.logicPlannerStep, t.contentGeneratorStep, t.summaryPushStep];

  const handleSubmit = async (formData) => {
    setLoading(true);
    setStage("generating");
    setGenStepIndex(0);
    setGenComplete(false);

    // Step 1: Logic Planner — Gemini Pro (good at structured planning)
    const logicPrompt = buildLogicPlannerPrompt(formData);
    const logicResult = await base44.integrations.Core.InvokeLLM({
      prompt: logicPrompt,
      model: "gemini_3_pro",
    });

    // Step 2: Content Generator — Claude Sonnet (best at rich educational content)
    setGenStepIndex(1);
    const dayPlan = extractDay1FromPlan(logicResult);
    const contentPrompt = buildContentGeneratorPrompt(formData, dayPlan, 1, []);
    const contentResult = await base44.integrations.Core.InvokeLLM({
      prompt: contentPrompt,
      model: "claude_sonnet_4_6",
    });

    // Step 3: Summary & Push — GPT-5 mini (fast, good at formatting/summarizing)
    setGenStepIndex(2);
    const summaryPrompt = `You are a learning assistant. Format the following generated lesson content cleanly for the student. Keep all content intact but ensure clean markdown formatting with clear sections. Content:\n\n${contentResult}`;
    const summaryResult = await base44.integrations.Core.InvokeLLM({
      prompt: summaryPrompt,
      model: "gpt_5_mini",
    });

    setGenComplete(true);
    setGeneratedPlan(summaryResult);

    // Save plan to database
    const plan = await base44.entities.LearningPlan.create({
      ...formData,
      full_plan_content: logicResult,
      current_day: 1,
      current_phase: "intensive",
      status: "active"
    });

    // Save Day 1 check-in record
    await base44.entities.CheckInRecord.create({
      plan_id: plan.id,
      day_number: 1,
      date: formData.start_date || new Date().toISOString().split('T')[0],
      scenario_type: "daily_checkin",
      content: summaryResult,
      status: "pending_answers"
    });

    setStage("preview");
    setLoading(false);
  };

  function extractDay1FromPlan(planText) {
    const day1Match = planText.match(/Day 1[\s\S]*?(?=Day 2|Phase 2|$)/i);
    if (day1Match) return day1Match[0].slice(0, 2000);
    const lines = planText.split('\n');
    const day1Idx = lines.findIndex(l => /day\s*1/i.test(l));
    if (day1Idx >= 0) return lines.slice(day1Idx, day1Idx + 30).join('\n');
    return lines.slice(0, 40).join('\n');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500 mb-4">
            <BookOpen className="w-3 h-3" />
            {t.setupBadge}
          </div>
          <h1 className="text-3xl font-bold text-slate-800">{t.setupTitle}</h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">{t.setupDesc}</p>
        </div>

        {stage === "form" && (
          <SetupForm onSubmit={handleSubmit} loading={loading} />
        )}

        {stage === "generating" && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">
              {genStepIndex === 0 ? '🧠' : genStepIndex === 1 ? '📚' : '✨'}
            </div>
            <p className="text-lg text-slate-700 font-semibold mb-1">
              {STEPS[genStepIndex]}
            </p>
            <p className="text-sm text-slate-400 mb-2">{t.waitMsg}</p>
            <GenerationProgress
              steps={STEPS}
              currentStepIndex={genStepIndex}
              isComplete={genComplete}
            />
          </div>
        )}

        {stage === "preview" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-10 mb-6">
              <ContentDisplay content={generatedPlan} />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => window.location.href = createPageUrl("Dashboard")}
                className="bg-slate-800 hover:bg-slate-700 text-white h-12 px-8"
              >
                {t.goToDashboard}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}