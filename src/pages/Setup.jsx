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

    // Step 1: Logic Planner — Gemini Pro (best for structured long-form planning)
    setGenStatus("🧠 Step 1/2: Logic Planner building your schedule...");
    const logicPrompt = buildLogicPlannerPrompt(formData);
    const logicResult = await base44.integrations.Core.InvokeLLM({
      prompt: logicPrompt,
      model: "gemini_3_pro"
    });

    // Step 2: Content Generator — Claude Sonnet (best for rich educational content)
    setGenStatus("📚 Step 2/2: Generating Day 1 lesson content...");
    const dayPlan = extractDay1FromPlan(logicResult);
    const contentPrompt = buildContentGeneratorPrompt(formData, dayPlan, 1, []);
    const contentResult = await base44.integrations.Core.InvokeLLM({
      prompt: contentPrompt,
      model: "claude_sonnet_4_6"
    });

    const summaryResult = contentResult;

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
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto mb-6" />
            <p className="text-lg text-slate-600 font-medium">{genStatus}</p>
            <p className="text-sm text-slate-400 mt-2">
              This runs a 3-model pipeline. Each model uses a different sub-prompt. Please wait...
            </p>
            <div className="mt-8 max-w-sm mx-auto">
              <div className="flex items-center gap-3 text-left">
                {["Logic Planner", "Content Generator", "Summary & Push"].map((name, i) => {
                  const isActive = genStatus.includes(`${i + 1}/3`);
                  const isDone = genStatus.includes(`${i + 2}/3`) || (i < 2 && genStatus.includes("3/3")) || stage === "preview";
                  return (
                    <div key={i} className="flex-1 text-center">
                      <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-slate-800 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {i + 1}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
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
                Go to Dashboard →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}