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

    // Step 1: Logic Planner — Gemini Pro (structured long-form planning)
    setGenStatus("🧠 Step 1/4: Logic Planner building schedule...");
    const logicPrompt = buildLogicPlannerPrompt(formData);
    const logicResult = await base44.integrations.Core.InvokeLLM({
      prompt: logicPrompt,
      model: "gemini_3_pro"
    });

    // Step 2: Plan Auditor — Claude Sonnet (cross-validates red-line rules, fixes hallucinations)
    setGenStatus("🔍 Step 2/4: Auditor validating plan against all rules...");
    const auditPrompt = buildPlanAuditorPrompt(formData, logicResult);
    const auditResult = await base44.integrations.Core.InvokeLLM({
      prompt: auditPrompt,
      model: "claude_sonnet_4_6"
    });

    // Extract Day 1 themes from the auditor's output (more reliable than raw logic output)
    const day1ThemesMatch = auditResult.match(/## Day 1 Knowledge Point Themes \(Extracted\)([\s\S]*?)(?=## Risk Flags|$)/i);
    const day1Themes = day1ThemesMatch ? day1ThemesMatch[1].trim() : extractDay1FromPlan(auditResult);
    const riskFlagsMatch = auditResult.match(/## Risk Flags for Content Generator([\s\S]*?)$/i);
    const riskFlags = riskFlagsMatch ? riskFlagsMatch[1].trim() : '';
    const correctedPlanMatch = auditResult.match(/## Corrected Full Plan([\s\S]*?)(?=## Day 1 Knowledge|$)/i);
    const correctedPlan = correctedPlanMatch ? correctedPlanMatch[1].trim() : logicResult;

    // Step 3: Content Generator — Claude Sonnet (rich educational content, informed by audit)
    setGenStatus("📚 Step 3/4: Generating Day 1 lesson content...");
    const contentPrompt = buildContentGeneratorPrompt(
      formData,
      day1Themes + (riskFlags ? `\n\n=== RISK FLAGS FROM AUDITOR ===\n${riskFlags}` : ''),
      1,
      []
    );
    const contentResult = await base44.integrations.Core.InvokeLLM({
      prompt: contentPrompt,
      model: "claude_sonnet_4_6"
    });

    // Step 4: Content Verifier — Gemini Flash (fast verification pass, catches Q-content misalignment)
    setGenStatus("✅ Step 4/4: Verifier checking question-content alignment...");
    const verifyPrompt = buildContentVerifierPrompt(formData, contentResult);
    const verifyResult = await base44.integrations.Core.InvokeLLM({
      prompt: verifyPrompt,
      model: "gemini_3_flash"
    });

    // Extract verified content (or fall back to original if verifier passed cleanly)
    const verifiedContentMatch = verifyResult.match(/## Verified & Corrected Content([\s\S]*)$/i);
    const summaryResult = verifiedContentMatch ? verifiedContentMatch[1].trim() : contentResult;

    setGeneratedPlan(summaryResult);

    // Save plan to database (use auditor-corrected plan)
    const plan = await base44.entities.LearningPlan.create({
      ...formData,
      full_plan_content: correctedPlan,
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
          <GeneratingProgress
            active={true}
            label={genStatus}
            subLabel="4-step pipeline: Logic Planner → Plan Auditor → Content Generator → Content Verifier"
            durationSeconds={120}
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