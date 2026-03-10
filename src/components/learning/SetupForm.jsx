import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, Shield, Clock, Calendar, ChevronRight, Zap } from "lucide-react";
import { useLang } from "../LanguageContext";

export default function SetupForm({ onSubmit, loading }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    program_name: "",
    current_foundation: "",
    total_duration: "",
    start_date: new Date().toISOString().split('T')[0],
    minimum_goal: "",
    sprint_goal: "",
    conflict_avoidance_start: "",
    conflict_avoidance_end: "",
    conflict_reason: "",
    daily_available_minutes: 60
  });

  const FIELD_CONFIG = [
    { key: "program_name", label: t.fieldProgramName, icon: BookOpen, placeholder: t.fieldProgramPlaceholder, description: t.fieldProgramDesc, type: "input" },
    { key: "current_foundation", label: t.fieldFoundation, icon: Zap, placeholder: t.fieldFoundationPlaceholder, description: t.fieldFoundationDesc, type: "textarea" },
    { key: "total_duration", label: t.fieldDuration, icon: Calendar, placeholder: t.fieldDurationPlaceholder, description: t.fieldDurationDesc, type: "input" },
    { key: "start_date", label: t.fieldStartDate, icon: Calendar, placeholder: "", description: t.fieldStartDateDesc, type: "date" },
    { key: "minimum_goal", label: t.fieldMinGoal, icon: Target, placeholder: t.fieldMinGoalPlaceholder, description: t.fieldMinGoalDesc, type: "textarea" },
    { key: "sprint_goal", label: t.fieldSprintGoal, icon: Target, placeholder: t.fieldSprintGoalPlaceholder, description: t.fieldSprintGoalDesc, type: "textarea" },
    { key: "daily_available_minutes", label: t.fieldDailyMins, icon: Clock, placeholder: t.fieldDailyMinsPlaceholder, description: t.fieldDailyMinsDesc, type: "number" },
  ];

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const isStepValid = () => {
    if (step < FIELD_CONFIG.length) {
      const field = FIELD_CONFIG[step];
      return form[field.key] !== "" && form[field.key] !== undefined;
    }
    return true;
  };

  const totalSteps = FIELD_CONFIG.length + 1;

  const renderField = (config) => {
    if (config.type === "textarea") {
      return (
        <Textarea
          value={form[config.key] || ""}
          onChange={(e) => handleChange(config.key, e.target.value)}
          placeholder={config.placeholder}
          className="min-h-[100px] text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
        />
      );
    }
    if (config.type === "date") {
      return (
        <Input
          type="date"
          value={form[config.key] || ""}
          onChange={(e) => handleChange(config.key, e.target.value)}
          className="text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
        />
      );
    }
    if (config.type === "number") {
      return (
        <Input
          type="number"
          min={10}
          max={480}
          value={form[config.key] || ""}
          onChange={(e) => handleChange(config.key, Number(e.target.value))}
          placeholder={config.placeholder}
          className="text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
        />
      );
    }
    return (
      <Input
        value={form[config.key] || ""}
        onChange={(e) => handleChange(config.key, e.target.value)}
        placeholder={config.placeholder}
        className="text-base border-slate-200 focus:border-slate-400 focus:ring-slate-400"
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{t.stepLabel} {step + 1} {t.ofLabel} {totalSteps}</span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-800 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step < FIELD_CONFIG.length ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              {React.createElement(FIELD_CONFIG[step].icon, { className: "w-5 h-5 text-slate-600" })}
              <CardTitle className="text-xl font-semibold text-slate-800">
                {FIELD_CONFIG[step].label}
              </CardTitle>
            </div>
            <p className="text-sm text-slate-500">{FIELD_CONFIG[step].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderField(FIELD_CONFIG[step])}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-slate-600" />
              <CardTitle className="text-xl font-semibold text-slate-800">{t.conflictTitle}</CardTitle>
            </div>
            <p className="text-sm text-slate-500">{t.conflictDesc}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-600">{t.conflictStartDate}</Label>
                <Input type="date" value={form.conflict_avoidance_start} onChange={(e) => handleChange("conflict_avoidance_start", e.target.value)} className="border-slate-200" />
              </div>
              <div>
                <Label className="text-sm text-slate-600">{t.conflictEndDate}</Label>
                <Input type="date" value={form.conflict_avoidance_end} onChange={(e) => handleChange("conflict_avoidance_end", e.target.value)} className="border-slate-200" />
              </div>
            </div>
            <div>
              <Label className="text-sm text-slate-600">{t.conflictReason}</Label>
              <Input value={form.conflict_reason} onChange={(e) => handleChange("conflict_reason", e.target.value)} placeholder={t.conflictReasonPlaceholder} className="border-slate-200" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="text-slate-500">
          {t.back}
        </Button>
        {step < totalSteps - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!isStepValid()} className="bg-slate-800 hover:bg-slate-700 text-white gap-2">
            {t.continue} <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={() => onSubmit(form)} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-white gap-2">
            {loading ? t.generatingPlan : t.generatePlan}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}