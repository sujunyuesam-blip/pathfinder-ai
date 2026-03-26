import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import SetupForm from "../components/learning/SetupForm";
import ContentDisplay from "../components/learning/ContentDisplay";
import GeneratingProgress from "../components/learning/GeneratingProgress";
import { buildLogicPlannerPrompt, buildContentGeneratorPrompt } from "../components/learning/PromptEngine";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("form"); // form, generating, preview
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [planData, setPlanData] = useState(null);
  const [genStatus, setGenStatus] = useState("");

  const handleSubmit = async (formData) => {
    setLoading(true);
    setStage("generating");
    setPlanData(formData);

    setGenStatus("🧠 Building schedule & Day 1 content in parallel...");

    // Run both LLM calls in parallel — content generator uses plan params directly
    const day1Bootstrap = `Day 1: Introduce the foundational knowledge points for ${formData.program_name}. Cover minimum goal basics first, then sprint goal advanced points.`;
    const [logicResult, summaryResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        prompt: buildLogicPlannerPrompt(formData),
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: buildContentGeneratorPrompt(formData, day1Bootstrap, 1, []),
      }),
    ]);

    setGeneratedPlan(summaryResult);

    // Save plan + Day 1 record in parallel
    const plan = await base44.entities.LearningPlan.create({
      ...formData,
      full_plan_content: logicResult,
      current_day: 1,
      current_phase: "intensive",
      status: "active"
    });

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
            Learning Check-in Agent
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Set Up Your Learning Plan</h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Configure your study parameters and we'll generate a complete learning roadmap with daily check-ins
          </p>
        </div>

        {stage === "form" && (
          <SetupForm onSubmit={handleSubmit} loading={loading} />
        )}

        {stage === "generating" && (
          <GeneratingProgress
            active={true}
            label={genStatus}
            subLabel="Generating your personalized learning plan..."
            durationSeconds={90}
          />
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
                Go to Dashboard →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}